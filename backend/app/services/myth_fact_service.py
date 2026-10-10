"""
MantraAI — Myth vs Fact Query & Clinical Evidence Synthesis Service
===================================================================

PURPOSE
-------
Orchestrates claim search, canonical matching, and cautious LLM evidence synthesis:
1. Normalizes user query.
2. Performs deterministic exact, alias, and token-similarity search against canonical corpus.
3. If an adequately matched claim exists, returns reviewed/draft knowledge unit.
4. If no canonical claim matches, retrieves relevant clinical guidelines from `EVIDENCE_CORPUS`.
5. If evidence is missing/inadequate, returns `INSUFFICIENT_EVIDENCE`.
6. If evidence exists, synthesizes a cautious, strictly grounded answer using Groq JSON mode.
7. Validates LLM outputs with strict Pydantic schemas (rejects forbidden fields & fabricated IDs).
8. Strictly marks all draft and generated content as unverified (`is_verified=False`).
9. Caches dynamic answers separately and logs queries for authenticated users.
"""

import hashlib
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple
from sqlalchemy.orm import Session

from app.config import settings
from app.models.myth_fact import (
    MythFactSource,
    MythFactClaim,
    MythFactAlias,
    MythFactGeneratedCache,
    MythFactQueryHistory,
)
from app.models.user import User
from app.schemas.myth_fact import (
    MythFactClassification,
    MatchTypeEnum,
    MythFactSourceOut,
    SynthesizedEvidenceItem,
    MythFactQueryRequest,
    MythFactQueryResponse,
    SynthesizedMythFactLLMOutput,
)
from app.services.evidence_retriever import retrieve_evidence, EvidenceContext
from app.services.myth_fact_importer import normalize_text_for_matching
from app.services.report_generator import execute_groq_request

logger = logging.getLogger(__name__)

STOPWORDS: Set[str] = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "do", "does", "did", "can", "could", "will", "would", "should", "may", "might", "must",
    "have", "has", "had", "having",
    "in", "on", "at", "to", "for", "with", "by", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below", "from",
    "up", "down", "in", "out", "over", "under", "again", "further",
    "then", "once", "here", "there", "when", "where", "why", "how",
    "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "s", "t", "just", "don", "should", "now",
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours",
    "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself",
    "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that",
}

DEFAULT_DISCLAIMER = (
    "MantraAI Myth vs Fact Engine is an evidence-informed educational tool. "
    "Content is curated for general health awareness and does not provide clinical diagnoses, "
    "fertility predictions, or individualized treatment plans. Always consult a qualified healthcare provider."
)


def extract_keywords(text: str) -> List[str]:
    """Extracts non-stopword alphanumeric tokens from text."""
    norm = normalize_text_for_matching(text)
    tokens = norm.split()
    return [t for t in tokens if t and t not in STOPWORDS and len(t) > 2]


def calculate_token_similarity(query_tokens: List[str], target_tokens: List[str]) -> float:
    """
    Calculates calibrated harmonic Dice/F1 similarity and containment between query and target tokens.
    Prevents short or generic queries from falsely matching long sentences.
    """
    if not query_tokens or not target_tokens:
        return 0.0

    q_set = set(query_tokens)
    t_set = set(target_tokens)

    intersection = q_set.intersection(t_set)
    if not intersection:
        return 0.0

    # Strictness rules for token count:
    # If query has 1 token: do not match multi-token sentences via similarity (require exact match)
    if len(q_set) == 1 and len(t_set) > 2:
        return 0.0

    # If query has multiple tokens: require at least 2 content words overlapping
    if len(q_set) >= 2 and len(intersection) < 2 and len(t_set) > 2:
        return 0.0

    dice = (2.0 * len(intersection)) / (len(q_set) + len(t_set))
    containment = len(intersection) / len(q_set)
    jaccard = len(intersection) / len(q_set.union(t_set))
    
    # Balanced calibrated search score
    score = (dice * 0.50) + (containment * 0.35) + (jaccard * 0.15)
    return min(1.0, score)


def find_canonical_match(
    query: str,
    db: Session,
    threshold: float = 0.70,
) -> Optional[Tuple[MythFactClaim, MatchTypeEnum, float, Optional[str]]]:
    """
    Deterministically searches the canonical database for an exact, alias, or high-similarity match.

    Returns
    -------
    Tuple of (claim, match_type, search_confidence_score, matched_phrase) or None.
    """
    norm_query = normalize_text_for_matching(query)
    if not norm_query:
        return None

    # 1. Exact Match on Canonical Claim
    exact_claim = db.query(MythFactClaim).filter(MythFactClaim.normalized_claim == norm_query).first()
    if exact_claim:
        return (exact_claim, MatchTypeEnum.CANONICAL_EXACT, 1.0, exact_claim.canonical_claim)

    # 2. Exact Match on Alias
    exact_alias = db.query(MythFactAlias).filter(MythFactAlias.normalized_alias == norm_query).first()
    if exact_alias and exact_alias.claim:
        return (exact_alias.claim, MatchTypeEnum.CANONICAL_ALIAS, 0.98, exact_alias.alias)

    # 3. Substring Containment Match
    # Check if normalized query is an exact substring of a claim or vice versa (for queries >= 4 words)
    q_words = norm_query.split()
    if len(q_words) >= 4:
        sub_claim = db.query(MythFactClaim).filter(
            (MythFactClaim.normalized_claim.like(f"%{norm_query}%")) |
            (MythFactClaim.normalized_claim == norm_query)
        ).first()
        if sub_claim:
            return (sub_claim, MatchTypeEnum.CANONICAL_EXACT, 0.95, sub_claim.canonical_claim)

        sub_alias = db.query(MythFactAlias).filter(
            (MythFactAlias.normalized_alias.like(f"%{norm_query}%")) |
            (MythFactAlias.normalized_alias == norm_query)
        ).first()
        if sub_alias and sub_alias.claim:
            return (sub_alias.claim, MatchTypeEnum.CANONICAL_ALIAS, 0.94, sub_alias.alias)

    # 4. Token-Overlap Similarity Match against all claims and aliases
    query_kw = extract_keywords(query)
    if not query_kw or len(query_kw) < 2:
        return None

    all_claims = db.query(MythFactClaim).all()
    best_match: Optional[Tuple[MythFactClaim, MatchTypeEnum, float, str]] = None
    highest_score = 0.0

    for claim in all_claims:
        claim_kw = extract_keywords(claim.canonical_claim)
        score = calculate_token_similarity(query_kw, claim_kw)

        if score > highest_score:
            highest_score = score
            best_match = (claim, MatchTypeEnum.CANONICAL_SIMILARITY, score, claim.canonical_claim)

        # Also check all aliases for this claim
        for alias in claim.aliases:
            alias_kw = extract_keywords(alias.alias)
            a_score = calculate_token_similarity(query_kw, alias_kw)
            if a_score > highest_score:
                highest_score = a_score
                best_match = (claim, MatchTypeEnum.CANONICAL_ALIAS, a_score, alias.alias)

    if best_match and highest_score >= threshold:
        return best_match

    return None


def resolve_sources_for_claim(source_ids: List[str], db: Session) -> List[MythFactSourceOut]:
    """Resolves a list of source_ids to MythFactSourceOut objects."""
    if not source_ids:
        return []
    sources = db.query(MythFactSource).filter(MythFactSource.source_id.in_(source_ids)).all()
    return [MythFactSourceOut.model_validate(s) for s in sources]


def build_groq_myth_fact_system_prompt() -> str:
    """Constructs a strict system prompt enforcing non-diagnostic, evidence-bound reasoning."""
    return """You are the MantraAI Clinical Evidence Synthesis Engine for Men's Health Myths & Facts.
Your role is to evaluate health questions or popular claims against provided clinical guideline excerpts with utmost medical safety.

STRICT CLINICAL & SAFETY RULES:
1. Grounding: Answer ONLY using the provided evidence excerpts. Do NOT invent findings, guidelines, or citations.
2. Allowed Classifications:
   - "FACT": Fully supported by authoritative guideline evidence.
   - "MYTH": Contradicted or disproven by authoritative guideline evidence.
   - "MISLEADING": Partially true or overgeneralized, but lacks proper clinical nuance.
   - "CONTEXT_DEPENDENT": The biological effect depends heavily on exposure duration, temperature, lifestyle context, or underlying health.
   - "INSUFFICIENT_EVIDENCE": The provided evidence does not establish a clear answer or is conflicting/absent.
3. FORBIDDEN OUTPUTS:
   - NEVER provide a medical diagnosis or disease label.
   - NEVER provide fertility percentage scores or probability predictions (e.g. "80% chance of conception").
   - NEVER provide medication prescriptions, dosages, or hormone treatments.
4. Tone: Non-judgmental, calm, evidence-grounded, clear everyday English.
5. Citing: In "cited_evidence_ids", list ONLY the exact `evidence_id` values provided in the prompt.

Output ONLY valid JSON matching this exact structure:
{
  "classification": "FACT" | "MYTH" | "MISLEADING" | "CONTEXT_DEPENDENT" | "INSUFFICIENT_EVIDENCE",
  "domain": "reproductive_health" | "sexual_health" | "lifestyle" | "environment_heat" | "diet_nutrition" | "substance_use" | "mental_behavioral" | "general_health",
  "explanation": "Clear, evidence-grounded explanation answering what is known, why it matters, and practical clinical context in 2-4 sentences.",
  "cited_evidence_ids": ["valid-evidence-id-1"],
  "reasoning": "Brief rationale for this classification.",
  "limitations": ["Evidence is based on observational or general population guidelines; individual clinical testing requires a healthcare provider."]
}"""


def map_query_to_evidence_tags(query: str, domain_hint: Optional[str] = None) -> List[str]:
    """
    Maps free-form query tokens to canonical guideline evidence tags.
    """
    norm = normalize_text_for_matching(query)
    tokens = set(extract_keywords(query))
    resolved_tags: Set[str] = set()

    # Topic keyword rules
    tag_mapping_rules = [
        ({"heat", "hot", "sauna", "tub", "laptop", "bath", "fever", "temperature", "underwear", "tight", "boxers", "scrotal", "scrotum"},
         ["heat_exposure", "sauna_hot_tub", "scrotal_temperature", "testicular_hyperthermia", "lifestyle_heat"]),
        ({"varicocele", "vein", "veins", "scrotal vein"},
         ["varicocele", "varicocele_screening", "venous_stasis"]),
        ({"smoke", "smoking", "tobacco", "cigarette", "cigarettes", "nicotine", "vape", "vaping"},
         ["smoking_tobacco", "nicotine", "oxidative_stress"]),
        ({"alcohol", "drinking", "beer", "wine", "liquor", "booze"},
         ["alcohol_consumption", "excessive_drinking"]),
        ({"cannabis", "marijuana", "weed", "thc", "pot"},
         ["cannabis_exposure", "cannabinoids"]),
        ({"steroid", "steroids", "anabolic", "testosterone", "trt", "gear"},
         ["anabolic_steroids", "exogenous_androgens", "endocrine_suppression"]),
        ({"sleep", "insomnia", "tired", "circadian"},
         ["sleep_duration", "sleep_hygiene", "circadian_rhythm"]),
        ({"exercise", "workout", "gym", "sedentary", "sitting"},
         ["physical_activity", "sedentary_behavior", "cardiovascular_fitness"]),
        ({"diet", "food", "nutrition", "antioxidant", "antioxidants", "supplement", "supplements", "vitamins", "zinc", "folate"},
         ["dietary_antioxidants", "dietary_balance"]),
        ({"semen", "sperm", "motility", "count", "morphology", "volume", "concentration"},
         ["semen_analysis", "semen_parameters", "male_infertility_evaluation"]),
        ({"erection", "erectile", "ed", "impotence"},
         ["erectile_function", "vascular_nervous_factors"]),
        ({"anxiety", "stress", "nervous", "performance", "panic", "psychological"},
         ["performance_anxiety", "psychosexual_health"]),
        ({"sti", "std", "infection", "condom", "condoms", "chlamydia", "gonorrhea"},
         ["sti_screening", "sti_history", "condom_use"]),
        ({"masturbation", "ejaculation", "abstinence"},
         ["ejaculatory_function", "ejaculatory_health", "accessory_gland_function"]),
    ]

    for trigger_words, canonical_tags in tag_mapping_rules:
        if trigger_words.intersection(tokens) or any(w in norm for w in trigger_words):
            resolved_tags.update(canonical_tags)

    if domain_hint:
        resolved_tags.add(domain_hint.strip().lower())

    return sorted(list(resolved_tags))


def synthesize_unmatched_claim(
    query: str,
    db: Session,
    domain_hint: Optional[str] = None,
) -> MythFactQueryResponse:
    """
    Handles unknown or inadequately matched claims by retrieving relevant guidelines
    and synthesizing a cautious, strictly validated answer.
    """
    norm_query = normalize_text_for_matching(query)
    q_hash = hashlib.sha256(norm_query.encode("utf-8")).hexdigest()

    # 1. Check Generated Answer Cache
    cached = db.query(MythFactGeneratedCache).filter(MythFactGeneratedCache.query_hash == q_hash).first()
    if cached:
        is_insufficient = (cached.classification == "INSUFFICIENT_EVIDENCE")
        # Resolve evidence items from cache
        cached_ev_items: List[SynthesizedEvidenceItem] = []
        if cached.evidence_ids and not is_insufficient:
            query_tags = map_query_to_evidence_tags(query, domain_hint)
            ev_context = retrieve_evidence(evidence_tags=query_tags, top_k=4)
            cached_ev_items = [
                SynthesizedEvidenceItem(
                    evidence_id=item.evidence_id,
                    document_id=item.document_id,
                    title=item.title,
                    source=item.source,
                    organization=item.organization,
                    publication_year=item.publication_year,
                    url=item.url,
                    source_identifier=item.source_identifier,
                    relevance_reason=item.relevance_reason,
                    excerpt=item.excerpt,
                )
                for item in ev_context.items
                if item.evidence_id in cached.evidence_ids
            ]

        return MythFactQueryResponse(
            query=query,
            match_type=MatchTypeEnum.INSUFFICIENT_EVIDENCE if is_insufficient else MatchTypeEnum.SYNTHESIZED_EVIDENCE,
            classification=MythFactClassification(cached.classification),
            domain=cached.domain,
            explanation=cached.explanation,
            confidence_score=0.0 if is_insufficient else 0.75,
            review_status=cached.review_status,
            is_verified=False,
            sources=[],
            guideline_evidence=cached_ev_items,
            limitations=cached.limitations or ["Dynamically synthesized from clinical guidelines; unreviewed draft."],
            disclaimer=cached.disclaimer or DEFAULT_DISCLAIMER,
        )

    # 2. Retrieve authoritative evidence
    query_tags = map_query_to_evidence_tags(query, domain_hint)
    evidence_context: EvidenceContext = retrieve_evidence(evidence_tags=query_tags, top_k=4)

    # 3. If no matching clinical evidence exists, return INSUFFICIENT_EVIDENCE
    if evidence_context.matched_count == 0:
        insufficient_explanation = (
            "Current authoritative clinical guidelines and peer-reviewed evidence indexed in MantraAI "
            "do not contain sufficient specific data to definitively classify this claim. "
            "When evaluating health topics with limited or conflicting evidence, cautious individual consultation "
            "with a qualified doctor is recommended rather than assuming a universal rule."
        )
        try:
            new_cache = MythFactGeneratedCache(
                query_hash=q_hash,
                query_text=query,
                classification=MythFactClassification.INSUFFICIENT_EVIDENCE.value,
                domain="general_health",
                explanation=insufficient_explanation,
                evidence_ids=[],
                model_provider="system_fallback",
                model_name="insufficient_evidence_rule",
                review_status="AI_SYNTHESIZED_UNREVIEWED",
                limitations=["No matching authoritative clinical guideline excerpts found in the indexed corpus."],
                disclaimer=DEFAULT_DISCLAIMER,
            )
            db.add(new_cache)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning("Could not persist insufficient evidence cache: %s", str(e))

        return MythFactQueryResponse(
            query=query,
            match_type=MatchTypeEnum.INSUFFICIENT_EVIDENCE,
            classification=MythFactClassification.INSUFFICIENT_EVIDENCE,
            domain="general_health",
            explanation=insufficient_explanation,
            confidence_score=0.0,
            review_status="AI_SYNTHESIZED_UNREVIEWED",
            is_verified=False,
            sources=[],
            guideline_evidence=[],
            limitations=["No matching authoritative clinical guideline excerpts found in the indexed corpus."],
            disclaimer=DEFAULT_DISCLAIMER,
        )

    # 4. Synthesize with Groq (or safe deterministic fallback)
    clean_evidence_for_prompt = [
        {
            "evidence_id": item.evidence_id,
            "title": item.title,
            "source": item.source,
            "year": item.publication_year,
            "excerpt": item.excerpt[:350],
        }
        for item in evidence_context.items
    ]
    valid_ev_ids = [item.evidence_id for item in evidence_context.items]

    user_prompt = json.dumps({
        "user_query": query,
        "available_evidence_excerpts": clean_evidence_for_prompt,
        "valid_evidence_ids": valid_ev_ids,
    })

    resolved_api_key = settings.GROQ_API_KEY
    resolved_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"

    synthesized_output: Optional[SynthesizedMythFactLLMOutput] = None

    if resolved_api_key and resolved_api_key.strip():
        try:
            raw_response = execute_groq_request(
                system_prompt=build_groq_myth_fact_system_prompt(),
                user_prompt=user_prompt,
                api_key=resolved_api_key,
                model=resolved_model,
                timeout_seconds=20.0,
            )
            data = json.loads(raw_response)
            synthesized_output = SynthesizedMythFactLLMOutput.model_validate(data)
        except Exception as e:
            logger.warning("Groq Myth vs Fact synthesis failed (%s). Utilizing deterministic guideline fallback.", str(e))

    # 5. Deterministic fallback if LLM synthesis was unavailable or failed
    if not synthesized_output:
        top_item = evidence_context.items[0]
        synthesized_output = SynthesizedMythFactLLMOutput(
            classification=MythFactClassification.CONTEXT_DEPENDENT,
            domain="general_health",
            explanation=(
                f"According to clinical guidance from {top_item.source} ({top_item.publication_year or 'guidelines'}), "
                f"this topic involves contextual physiological factors: {top_item.excerpt[:220]}... "
                "Guideline evidence evaluates modifiable risk factors rather than establishing a diagnosis or universal outcome."
            ),
            cited_evidence_ids=[top_item.evidence_id],
            reasoning="Synthesized via deterministic guideline matching fallback.",
            limitations=["Synthesized from indexed guideline excerpts without active LLM completion."],
        )

    # 6. Validate and filter cited evidence IDs (prevent hallucinated IDs)
    filtered_cited_ids = [eid for eid in synthesized_output.cited_evidence_ids if eid in valid_ev_ids]
    if not filtered_cited_ids and synthesized_output.classification != MythFactClassification.INSUFFICIENT_EVIDENCE:
        if valid_ev_ids:
            filtered_cited_ids = [valid_ev_ids[0]]
        else:
            synthesized_output.classification = MythFactClassification.INSUFFICIENT_EVIDENCE

    guideline_items = [
        SynthesizedEvidenceItem(
            evidence_id=item.evidence_id,
            document_id=item.document_id,
            title=item.title,
            source=item.source,
            organization=item.organization,
            publication_year=item.publication_year,
            url=item.url,
            source_identifier=item.source_identifier,
            relevance_reason=item.relevance_reason,
            excerpt=item.excerpt,
        )
        for item in evidence_context.items
        if item.evidence_id in filtered_cited_ids
    ]

    # 7. Store in Generated Answer Cache
    try:
        new_cache = MythFactGeneratedCache(
            query_hash=q_hash,
            query_text=query,
            classification=synthesized_output.classification.value,
            domain=synthesized_output.domain,
            explanation=synthesized_output.explanation,
            evidence_ids=filtered_cited_ids,
            model_provider="groq" if resolved_api_key else "deterministic_fallback",
            model_name=resolved_model,
            review_status="AI_SYNTHESIZED_UNREVIEWED",
            limitations=synthesized_output.limitations,
            disclaimer=DEFAULT_DISCLAIMER,
        )
        db.add(new_cache)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning("Could not persist generated answer cache: %s", str(e))

    is_insufficient = (synthesized_output.classification == MythFactClassification.INSUFFICIENT_EVIDENCE)

    return MythFactQueryResponse(
        query=query,
        match_type=MatchTypeEnum.INSUFFICIENT_EVIDENCE if is_insufficient else MatchTypeEnum.SYNTHESIZED_EVIDENCE,
        classification=synthesized_output.classification,
        domain=synthesized_output.domain,
        explanation=synthesized_output.explanation,
        confidence_score=0.0 if is_insufficient else 0.75,
        review_status="AI_SYNTHESIZED_UNREVIEWED",
        is_verified=False,
        sources=[],
        guideline_evidence=guideline_items if not is_insufficient else [],
        limitations=synthesized_output.limitations or ["Dynamically synthesized from clinical guidelines; unreviewed draft."],
        disclaimer=DEFAULT_DISCLAIMER,
    )


def process_myth_fact_query(
    request: MythFactQueryRequest,
    db: Session,
    user: Optional[User] = None,
) -> MythFactQueryResponse:
    """
    Primary entry point for processing Myth vs Fact queries.
    Handles canonical matching, dynamic synthesis fallback, and query history persistence.
    """
    query = request.query.strip()
    match_res = find_canonical_match(query, db)

    if match_res:
        claim, match_type, conf_score, _ = match_res
        sources = resolve_sources_for_claim(claim.evidence_source_ids or [], db)
        
        # Check if review status is verified (only CLINICIAN_VERIFIED is true)
        is_verified = (claim.review_status == "CLINICIAN_VERIFIED")

        response = MythFactQueryResponse(
            query=query,
            match_type=match_type,
            claim_id=claim.claim_id,
            canonical_claim=claim.canonical_claim,
            classification=MythFactClassification(claim.classification),
            domain=claim.domain,
            explanation=claim.explanation,
            confidence_score=round(conf_score, 3),
            review_status=claim.review_status,
            is_verified=is_verified,
            sources=sources,
            guideline_evidence=[],
            limitations=[
                "Canonical knowledge unit; curated draft requires clinician review before formal medical use."
            ] if not is_verified else [],
            disclaimer=DEFAULT_DISCLAIMER,
        )
    else:
        response = synthesize_unmatched_claim(query, db, domain_hint=request.domain_hint)

    # Persist in user query history if user is authenticated and history saving enabled
    if user and request.save_history:
        try:
            history_record = MythFactQueryHistory(
                user_id=user.id,
                query_text=query,
                match_type=response.match_type.value,
                matched_claim_id=response.claim_id,
                classification=response.classification.value,
                domain=response.domain,
                explanation=response.explanation,
                evidence_source_ids=[s.source_id for s in response.sources] or [g.evidence_id for g in response.guideline_evidence],
                review_status=response.review_status,
                confidence_score=response.confidence_score,
                model_metadata={"engine_version": "1.0"},
            )
            db.add(history_record)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning("Failed to persist user query history: %s", str(e))

    return response
