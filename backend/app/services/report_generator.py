"""
MantraAI — Groq Structured Report Generator
============================================

PURPOSE
-------
Orchestrates structured LLM report synthesis for MantraAI by combining:
1. NormalizedAssessment (typed questionnaire responses across 13 domains)
2. HealthContext (deterministic health signals, factors, and clinical tags)
3. EvidenceContext (retrieved authoritative clinical guidelines and provenance)
4. MantraAIReport (strict Pydantic schema validation contract)

PIPELINE
--------
Raw Questionnaire Responses
        ↓
normalize_assessment_responses()
        ↓
build_health_context()
        ↓
retrieve_evidence_for_health_context()
        ↓
Groq Structured Plain-Language Generation (JSON Mode)
        ↓
Pydantic Validation (MantraAIReport)
        ↓
Evidence & Question ID Verification
        ↓
Validated Report Persisted & Returned

SAFETY & CLINICAL BOUNDARIES
----------------------------
- STRICTLY NON-DIAGNOSTIC: No diagnostic disease labels or inferences.
- NO FERTILITY PREDICTION: No fertility/infertility probabilities, scores, or percentages.
- NO INVENTED CLINICAL VALUES: No semen parameters, lab values, or imaging findings.
- NO INVENTED EVIDENCE: Cites only evidence IDs provided in EvidenceContext.
- NO PRESCRIPTIONS: No medication recommendations, dosages, or hormone therapies.
- PRIVACY SHIELD: Never logs raw answers, sexual/mental health responses, or sensitive prompts.
"""

import json
import logging
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Any, Optional, Union

from pydantic import ValidationError

from app.config import settings
from app.schemas.report import (
    MantraAIReport,
    ReportMetadata,
    ExecutiveSummary,
    ReproductiveHealthReportSection,
    SexualHealthReportSection,
    MentalBehavioralWellnessReportSection,
    LifestyleWellnessReportSection,
    EnvironmentalExposureReportSection,
    SubstanceMedicationReportSection,
    PriorityFactorReportItem,
    PositiveFactorReportItem,
    PersonalizedAction,
    ClinicianDiscussionQuestion,
    ProfessionalHelpGuidance,
    EvidenceReference,
    ReportLimitations,
    FORBIDDEN_FIELDS,
    ReportDomain,
    ActionType,
    ClinicalUrgency,
    WellnessStatus,
)
from app.services.normalizer import NormalizedAssessment, QUESTION_DOMAIN_MAP
from app.services.context_engine import HealthContext, FactorItem
from app.services.evidence_retriever import EvidenceContext, EvidenceItem
from app.services.evidence_taxonomy import get_tag_domain
from app.services.evidence_corpus import CHUNK_MAP, DOCUMENT_MAP

logger = logging.getLogger(__name__)

MAX_REPORT_ATTEMPTS = 3
GROQ_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


# ===========================================================================
# Custom Exceptions
# ===========================================================================

class ReportGenerationError(Exception):
    """Base exception for report generation errors."""
    pass


class ReportAuthError(ReportGenerationError):
    """Authentication or permission error with the LLM provider (401/403)."""
    pass


class ReportRateLimitError(ReportGenerationError):
    """Rate limit error with the LLM provider (429)."""
    def __init__(self, message: str, retry_after_seconds: Optional[float] = None):
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


class ReportConnectionError(ReportGenerationError):
    """Network connection error, timeout, or 5xx server error."""
    pass


class MalformedReportJSONError(ReportGenerationError):
    """LLM response was not valid JSON."""
    pass


class ReportValidationError(ReportGenerationError):
    """LLM output violated the strict MantraAIReport Pydantic schema."""
    pass


class InvalidEvidenceReferenceError(ReportGenerationError):
    """LLM output referenced unknown evidence IDs not present in EvidenceContext."""
    pass


class InvalidQuestionIdError(ReportGenerationError):
    """LLM output referenced unknown source question IDs not present in questionnaire."""
    pass


# ===========================================================================
# System Prompt & User Prompt Builders
# ===========================================================================

def build_system_prompt() -> str:
    """
    Constructs the authoritative system prompt enforcing plain-language communication,
    compassionate educational tone, strict clinical safety boundaries, calibrated medical language,
    and strict schema compliance.
    """
    return """You are the personal health report writer for MantraAI, an educational men's health and wellness platform in India.

YOUR AUDIENCE:
You are writing for a person with NO medical or technical background. Your goal is to explain their health screening results in clear, warm, conversational English that is completely free of academic jargon.

PLAIN-LANGUAGE WRITING RULES:
1. SIMPLICITY & TONE: Write in friendly, empathetic everyday English. Use short paragraphs and short, active sentences.
2. BAN ON JARGON: NEVER use internal or technical phrases such as "risk vector", "deterministic context", "evidence mapping", "optimization opportunity", "LLM synthesis", "context signal", or "screening artifact".
3. NO RAW TECHNICAL VARIABLE NAMES: NEVER output raw database keys, internal question IDs, or snake_case identifiers (such as `known_varicocele: Unsure`, `ejaculation_concerns: Low volume`, `phq9_score: 4`, `gad7_score: 5`, `perceived_stress_pss10: 10`, `masturbation_control: Often`, `spectatoring_self_monitoring: Agree`, `prior_sti_history: Yes`, `childhood_disease_mumps: Yes`) in `reported_context`, `relevant_factors`, summaries, or anywhere in the report. Always express reported items in natural, respectful English sentences.
4. EXPLAIN TERMS: If you mention a term like BMI, oxidative stress, or scrotal temperature, explain what it means in one simple sentence immediately.
5. ANSWER THE THREE CORE QUESTIONS:
   - For every priority factor: What is it? Why does it matter to your health? What practical step can you take?
   - For positive factors: What are you already doing well? Why is it beneficial to keep doing it?
   - For action plan: What should you do? When should you start? Why does it help?
6. REASSURING & PRACTICAL: Keep the tone calm, constructive, and non-alarmist.

CALIBRATED, EVIDENCE-INFORMED MEDICAL LANGUAGE:
1. NON-DIAGNOSTIC & NON-CAUSAL: You must NEVER claim that a questionnaire response proves a disease, infertility, hormone disorder, sperm abnormality, or other diagnosis.
2. PROHIBITED PHRASES: NEVER use unsupported definitive claims such as "causes infertility", "damages sperm", "proves", "will reduce fertility", or "causes hormone imbalance".
3. PREFERRED CALIBRATED PHRASES: Prefer wording such as:
   - "may be associated with"
   - "can be relevant to"
   - "is worth discussing"
   - "may warrant further evaluation"
   - "evidence is mixed"
   - "your response suggests"
   - "this is a contextual factor"
4. SPECIFIC TOPIC CALIBRATION:
   - Phone placement / RF / EMF: Scientific evidence is mixed; recommend practical habits (e.g. keeping devices on a desk when possible) without claiming proven damage.
   - Pesticides / Welding / Heavy metals: Discuss standard occupational hygiene and protective equipment without asserting personal poisoning.
   - Endocrine disruption / Oxidative stress: Describe as general biological mechanisms, not confirmed patient pathology.
   - Masturbation & Pornography frequency: Frame neutrally, respectfully, and non-judgmentally. Normal sexual habits do NOT cause physical damage or infertility; focus on self-reported comfort and stress.
   - Supplements & Diet: Emphasize balanced nutrition and discussing any supplements with a healthcare professional; do not promise that supplements cure or prevent disorders.
   - Sexual performance: Acknowledge that energy, desire, and stamina naturally fluctuate with stress, sleep, and recovery; never diagnose sexual dysfunctions.
   - Mental health proxies (PHQ-9, GAD-7, PSS-10): Treat these exclusively as brief self-reported questionnaire screening proxy indicators, NOT as formal clinical diagnoses or validated psychiatric instruments.

MANDATORY CLINICAL & SAFETY BOUNDARIES:
1. NON-DIAGNOSTIC: You must NEVER diagnose medical conditions or label responses as clinical disorders (e.g. do not diagnose erectile dysfunction, varicocele, hypogonadism, clinical depression, or anxiety disorders).
2. NO FERTILITY PREDICTIONS: You must NEVER calculate, estimate, or mention fertility probabilities, infertility percentages, pregnancy chances, or fertility scores.
3. NO INVENTED CLINICAL VALUES: You must NEVER invent semen parameters (sperm count, motility, morphology), hormonal concentrations, or imaging results.
4. STRICT EVIDENCE TRACEABILITY: You can ONLY reference evidence items explicitly supplied in the `evidence_context` input using their exact `evidence_id` values. Never invent citations, authors, PMIDs, DOIs, URLs, or external guidelines.
5. NO PRESCRIPTIONS: Never recommend prescription medications, hormone therapy, specific drug dosages, or discontinuing prescribed medication. Always advise discussing medications with a qualified clinician.
6. SOURCE QUESTION TRACEABILITY: `source_question_ids` must ONLY contain question IDs provided in the `valid_question_ids_to_cite` or `assessment_context` list. It MUST have at least 1 item (never leave empty).
7. NO FORBIDDEN KEYS: Do not include forbidden fields (such as fertility_probability, diagnosis, etc.).

CRITICAL COMPLETENESS REQUIREMENTS:
You MUST generate ALL 16 sections with COMPLETE content:
- "executive_summary": clear headline and 2-3 paragraph overview.
- "reproductive_health", "sexual_health", "mental_behavioral_wellness", "lifestyle_wellness", "environmental_exposure", "substance_medication": 6 complete domain sections. If a domain has no concerns reported, state: "No specific concerns were identified from the answers provided in this area."
- "priority_factors": MUST contain 2 to 5 structured items identifying modifiable factors or routine areas for attention.
- "positive_factors": MUST contain 2 to 5 structured items celebrating positive health habits and protective baselines.
- "personalized_action_plan": MUST contain 3 to 5 clear, evidence-informed action steps.
- "questions_to_discuss_with_clinician": MUST contain 2 to 4 practical questions for physician consultation.
- "when_to_seek_professional_help": MUST contain 2 to 4 clear clinical consultation indicators.
- "evidence": MUST contain all evidence references from evidence_context.
- "limitations": complete summary, methodology notes, and specific limitation items.
- "disclaimer": complete safety disclaimer text.

JSON OUTPUT CONTRACT:
You must output a single valid JSON object matching the exact MantraAIReport schema:
{
  "report_metadata": {
    "report_version": "2.0",
    "generated_at": "<ISO8601_TIMESTAMP>",
    "model_provider": "groq",
    "model_name": "<MODEL_NAME>",
    "questionnaire_version": "1.0"
  },
  "executive_summary": {
    "headline": "Encouraging summary headline in everyday English",
    "overview": "2-3 short, conversational paragraphs explaining strengths, areas to monitor, and practical steps.",
    "key_themes": ["Daily Physical Activity", "Sleep & Rest", "Nutrition & Hydration"],
    "areas_for_attention": ["Daily sitting duration", "Sleep schedule regularity"],
    "positive_context": ["Consistent daily hydration", "Regular fruit and vegetable intake"],
    "overall_wellness_status": "Stable" | "Worth monitoring" | "Several areas need attention"
  },
  "reproductive_health": {
    "summary": "Clear, non-diagnostic overview of reproductive wellness in plain language.",
    "reported_context": ["Reported history item in natural English"],
    "relevant_factors": ["Context factor in natural English"],
    "evidence_refs": ["valid-evidence-id"],
    "limitations": ["Self-reported questionnaire responses do not replace laboratory testing or physician examinations."]
  },
  "sexual_health": {
    "summary": "Supportive, non-judgmental explanation of psychosexual wellness.",
    "reported_context": ["Reported item in natural English"],
    "relevant_factors": ["Context factor in natural English"],
    "evidence_refs": ["valid-evidence-id"],
    "limitations": ["Sexual wellbeing is influenced by stress, fatigue, and normal daily variations."]
  },
  "mental_behavioral_wellness": {
    "summary": "Everyday explanation of stress, mood, and daily rest routines.",
    "reported_context": ["Reported item in natural English"],
    "relevant_factors": ["Context factor in natural English"],
    "evidence_refs": ["valid-evidence-id"],
    "limitations": ["Wellness questions provide personal context and are not a psychiatric evaluation."]
  },
  "lifestyle_wellness": {
    "summary": "Everyday explanation of movement, nutrition, hydration, and sleep habits.",
    "relevant_factors": ["Context factor in natural English"],
    "evidence_refs": ["valid-evidence-id"],
    "limitations": ["Based on self-reported estimates of daily habits."]
  },
  "environmental_exposure": {
    "summary": "Plain-language review of heat, workplace, or electronic exposures.",
    "relevant_factors": ["Context factor in natural English"],
    "evidence_refs": ["valid-evidence-id"],
    "limitations": ["Environmental observations reflect general patterns rather than individual direct outcomes."]
  },
  "substance_medication": {
    "summary": "Plain-language summary of tobacco, alcohol, and medication context.",
    "relevant_factors": ["Context factor in natural English"],
    "evidence_refs": ["valid-evidence-id"],
    "limitations": ["Always discuss any medication or supplement changes directly with your doctor."]
  },
  "priority_factors": [
    {
      "id": "pf_1",
      "domain": "reproductive_health" | "sexual_health" | "lifestyle_wellness" | "environmental_exposure" | "mental_behavioral_wellness" | "substance_medication",
      "title": "Clear everyday title (e.g. Daily Physical Activity)",
      "description": "Explains What it is, Why it matters in simple terms, and What practical step to take.",
      "source_question_ids": ["question_id_from_context"],
      "evidence_refs": ["valid-evidence-id"],
      "actionable": true,
      "severity": "low" | "moderate" | "notable"
    }
  ],
  "positive_factors": [
    {
      "id": "pos_1",
      "domain": "lifestyle_wellness" | "...",
      "title": "Clear everyday title (e.g. Balanced Daily Hydration)",
      "description": "Celebrates the healthy habit and explains why it helps maintain overall wellness.",
      "source_question_ids": ["question_id_from_context"],
      "evidence_refs": ["valid-evidence-id"]
    }
  ],
  "personalized_action_plan": [
    {
      "id": "act_1",
      "title": "Clear action step (e.g. Take short walking breaks every hour)",
      "description": "Concrete, practical implementation advice.",
      "domain": "lifestyle_wellness" | "...",
      "rationale": "Simple explanation of why this step is helpful.",
      "evidence_refs": ["valid-evidence-id"],
      "timeframe": "1-2 weeks" | "1-3 months" | "ongoing",
      "action_type": "lifestyle" | "self_monitoring" | "education" | "professional_discussion" | "follow_up_assessment",
      "priority": 1
    }
  ],
  "questions_to_discuss_with_clinician": [
    {
      "id": "cq_1",
      "question": "Practical, comfortable question to ask your physician",
      "domain": "reproductive_health" | "...",
      "reason": "Why this question is relevant to your assessment context"
    }
  ],
  "when_to_seek_professional_help": [
    {
      "trigger": "Clear situation or symptom",
      "explanation": "Why an in-person medical consultation is recommended",
      "urgency": "routine" | "timely" | "prompt"
    }
  ],
  "evidence": [
    {
      "evidence_id": "valid-evidence-id",
      "title": "Official Title from EvidenceContext",
      "source": "WHO / AUA/ASRM / EAU",
      "year": 2024,
      "url": "https://official-url.org",
      "source_identifier": "DOI/PMID/ISBN",
      "relevance": "Plain language explanation of relevance"
    }
  ],
  "limitations": {
    "summary": "Assessment conducted via self-reported structured questionnaire.",
    "methodology_notes": ["Informational screening only; does not provide clinical diagnosis."],
    "items": ["Specific limitation items"]
  },
  "disclaimer": "MantraAI is an evidence-informed educational and wellness platform. This report does not provide medical diagnoses, clinical prognoses, or treatment prescriptions. Always consult a qualified physician for personalized clinical care."
}

Ensure all 16 top-level keys are present and non-empty. Output ONLY valid JSON."""


def build_user_prompt(
    normalized_assessment: NormalizedAssessment,
    health_context: HealthContext,
    evidence_context: EvidenceContext,
    metadata: ReportMetadata,
) -> str:
    """
    Constructs a compact, token-efficient JSON payload containing normalized responses,
    deterministic health signals, and retrieved evidence context.
    """
    # Filter out empty domains and None values to optimize token payload
    clean_assessment = {
        domain: {q: v for q, v in answers.items() if v is not None}
        for domain, answers in normalized_assessment.model_dump().items()
        if isinstance(answers, dict) and any(v is not None for v in answers.values())
    }

    # Extract all valid canonical question IDs that were answered
    valid_q_ids: list[str] = []
    for domain, answers in clean_assessment.items():
        if isinstance(answers, dict):
            for q_id in answers.keys():
                if q_id in QUESTION_DOMAIN_MAP:
                    valid_q_ids.append(q_id)

    if not valid_q_ids:
        valid_q_ids = ["age_years", "physical_activity_level"]

    clean_evidence_items = [
        {
            "evidence_id": item.evidence_id,
            "title": item.title,
            "source": item.source,
            "year": item.publication_year,
            "url": item.url,
            "source_identifier": item.source_identifier,
            "relevance_reason": item.relevance_reason,
            "excerpt": item.excerpt[:240] if len(item.excerpt) > 240 else item.excerpt,
        }
        for item in evidence_context.items[:6]
    ]

    valid_ev_ids = [item["evidence_id"] for item in clean_evidence_items]

    payload = {
        "report_metadata": metadata.model_dump(),
        "valid_question_ids_to_cite": valid_q_ids,
        "valid_evidence_ids_to_cite": valid_ev_ids,
        "assessment_context": clean_assessment,
        "health_context": {
            "modifiable_factors": [
                {"id": f.id, "domain": f.domain, "reason": f.reason, "source_questions": [q for q in f.source_question_ids if q in QUESTION_DOMAIN_MAP]}
                for f in health_context.modifiable_factors
            ],
            "positive_factors": [
                {"id": f.id, "domain": f.domain, "reason": f.reason, "source_questions": [q for q in f.source_question_ids if q in QUESTION_DOMAIN_MAP]}
                for f in health_context.positive_factors
            ],
            "follow_up_flags": [
                {"id": f.id, "domain": f.domain, "reason": f.reason, "source_questions": [q for q in f.source_question_ids if q in QUESTION_DOMAIN_MAP]}
                for f in health_context.follow_up_flags
            ],
        },
        "evidence_context": {
            "matched_count": len(clean_evidence_items),
            "items": clean_evidence_items,
        },
        "instructions": (
            "Generate the complete MantraAIReport in clear, natural, everyday English. "
            "Explain what is going well, what areas are worth paying attention to, why they matter, and what practical steps to take. "
            "You MUST generate ALL 16 top-level sections matching the JSON schema in the system prompt. "
            "Ensure priority_factors has 2-5 items, positive_factors has 2-5 items, personalized_action_plan has 3-5 items, "
            "questions_to_discuss_with_clinician has 2-4 items, when_to_seek_professional_help has 2-4 items, and evidence has all retrieved items. "
            "Every item in priority_factors and positive_factors MUST have source_question_ids containing at least 1 valid ID from valid_question_ids_to_cite. "
            "Use only the supplied evidence_id values in valid_evidence_ids_to_cite. Do not omit any section."
        )
    }

    return json.dumps(payload, separators=(',', ':'))


# ===========================================================================
# Validation Pipeline
# ===========================================================================

def validate_report_content(
    raw_content: Union[str, dict[str, Any]],
    evidence_context: EvidenceContext,
) -> MantraAIReport:
    """
    Strict validation pipeline:
    1. Parses JSON if string (stripping markdown fences if present).
    2. Validates against MantraAIReport (recursively rejecting forbidden fields).
    3. Validates that all evidence_refs point to existing retrieved evidence_ids.
    4. Validates that all source_question_ids exist in the canonical questionnaire mapping.
    """
    # 1. Parse JSON
    if isinstance(raw_content, str):
        content_str = raw_content.strip()
        if content_str.startswith("```json"):
            content_str = content_str[7:]
        elif content_str.startswith("```"):
            content_str = content_str[3:]
        if content_str.endswith("```"):
            content_str = content_str[:-3]
        content_str = content_str.strip()

        try:
            data = json.loads(content_str)
        except json.JSONDecodeError as e:
            raise MalformedReportJSONError(f"Malformed JSON from LLM: {str(e)}") from e
    elif isinstance(raw_content, dict):
        data = raw_content
    else:
        raise MalformedReportJSONError(f"Expected dict or string, got {type(raw_content).__name__}")

    # 2. Pydantic schema validation (enforces all 16 sections, no extra fields, no forbidden blacklist fields)
    try:
        report = MantraAIReport.model_validate(data)
    except ValidationError as e:
        raise ReportValidationError(f"Report failed schema validation: {str(e)}") from e

    # 3. Application-level Evidence Reference Validation
    valid_evidence_ids = {item.evidence_id for item in evidence_context.items}
    
    # Collect all evidence references cited across all sections
    used_evidence_refs: list[str] = []
    used_evidence_refs.extend(report.reproductive_health.evidence_refs)
    used_evidence_refs.extend(report.sexual_health.evidence_refs)
    used_evidence_refs.extend(report.mental_behavioral_wellness.evidence_refs)
    used_evidence_refs.extend(report.lifestyle_wellness.evidence_refs)
    used_evidence_refs.extend(report.environmental_exposure.evidence_refs)
    used_evidence_refs.extend(report.substance_medication.evidence_refs)
    for f in report.priority_factors:
        used_evidence_refs.extend(f.evidence_refs)
    for p in report.positive_factors:
        used_evidence_refs.extend(p.evidence_refs)
    for a in report.personalized_action_plan:
        used_evidence_refs.extend(a.evidence_refs)
    for ev in report.evidence:
        used_evidence_refs.append(ev.evidence_id)

    # If evidence items exist, ensure no hallucinated/unknown evidence_id was cited
    for ref in used_evidence_refs:
        if ref not in valid_evidence_ids:
            raise InvalidEvidenceReferenceError(
                f"Unknown evidence_id '{ref}' referenced in report. Valid IDs: {sorted(list(valid_evidence_ids))}"
            )

    # 4. Application-level Source Question ID Validation
    known_q_ids = set(QUESTION_DOMAIN_MAP.keys())
    for f in report.priority_factors:
        for q_id in f.source_question_ids:
            if q_id not in known_q_ids:
                raise InvalidQuestionIdError(f"Unknown source_question_id '{q_id}' in priority_factors item '{f.id}'")
    for p in report.positive_factors:
        for q_id in p.source_question_ids:
            if q_id not in known_q_ids:
                raise InvalidQuestionIdError(f"Unknown source_question_id '{q_id}' in positive_factors item '{p.id}'")

    return report


# ===========================================================================
# Deterministic Fallback Generator
# ===========================================================================

def normalize_report_domain(domain: str) -> ReportDomain:
    """Normalizes internal domain strings to controlled ReportDomain enum literals."""
    d = domain.lower().strip()
    if "heat" in d or "env" in d:
        return "environmental_exposure"
    if "repro" in d:
        return "reproductive_health"
    if "sex" in d:
        return "sexual_health"
    if "mental" in d or "stress" in d or "coping" in d or "psych" in d:
        return "mental_behavioral_wellness"
    if "substance" in d or "med" in d or "drug" in d:
        return "substance_medication"
    return "lifestyle_wellness"


# ---------------------------------------------------------------------------
# Fallback Evidence Matching Helpers
# ---------------------------------------------------------------------------

def _get_item_domains(item: EvidenceItem) -> set[ReportDomain]:
    """Extracts all valid report domains supported by an EvidenceItem's metadata."""
    domains: set[ReportDomain] = set()
    tags: set[str] = {t.lower().strip() for t in item.matched_tags if t}
    chunk = CHUNK_MAP.get(item.evidence_id) or (CHUNK_MAP.get(item.chunk_id) if item.chunk_id else None)
    if chunk:
        tags.update(t.lower().strip() for t in chunk.evidence_tags if t)
    else:
        doc = DOCUMENT_MAP.get(item.document_id)
        if doc:
            tags.update(t.lower().strip() for t in doc.evidence_tags if t)

    for t in tags:
        canonical_dom = get_tag_domain(t)
        if canonical_dom:
            domains.add(normalize_report_domain(canonical_dom))
        else:
            if any(k in t for k in ("repro", "fertility", "semen", "varicocele", "testicular")):
                domains.add("reproductive_health")
            elif any(k in t for k in ("libido", "erectile", "masturbat", "pornograph")):
                domains.add("sexual_health")
            elif any(k in t for k in ("sleep", "sedentary", "activity", "exercise", "diet", "nutrition", "hydration", "bmi")):
                domains.add("lifestyle_wellness")
            elif any(k in t for k in ("heat", "temperature", "laptop", "toxin", "pesticide", "heavy_metal", "radiation")):
                domains.add("environmental_exposure")
            elif any(k in t for k in ("stress", "anxiety", "mood", "mental", "depression", "coping")):
                domains.add("mental_behavioral_wellness")
            elif any(k in t for k in ("tobacco", "nicotine", "smoking", "alcohol", "cannabis", "steroid", "medication", "drug")):
                domains.add("substance_medication")
    return domains


def find_evidence_for_domain(
    evidence_items: list[EvidenceItem],
    target_domain: ReportDomain,
    limit: int = 2,
) -> list[str]:
    """Returns canonical evidence IDs from retrieved items that defensibly match the target domain."""
    matching_ids: list[str] = []
    norm_target = normalize_report_domain(target_domain)
    for item in evidence_items:
        if norm_target in _get_item_domains(item):
            if item.evidence_id not in matching_ids:
                matching_ids.append(item.evidence_id)
            if len(matching_ids) >= limit:
                break
    return matching_ids


def find_evidence_for_factor(
    evidence_items: list[EvidenceItem],
    factor_domain: str,
    factor_tags: Optional[list[str]] = None,
    limit: int = 2,
) -> list[str]:
    """
    Returns canonical evidence IDs from retrieved items that defensibly support
    the given factor. Items with direct tag overlap within the factor's domain
    are prioritized. Returns empty list if no domain/tag match is found.
    """
    norm_domain = normalize_report_domain(factor_domain)
    f_tags = {t.lower().strip() for t in (factor_tags or []) if t and isinstance(t, str)}

    direct_tag_matches: list[str] = []
    domain_matches: list[str] = []

    for item in evidence_items:
        item_doms = _get_item_domains(item)
        if norm_domain not in item_doms:
            continue

        all_item_tags = {t.lower().strip() for t in item.matched_tags if t}
        chunk = CHUNK_MAP.get(item.evidence_id) or (CHUNK_MAP.get(item.chunk_id) if item.chunk_id else None)
        if chunk:
            all_item_tags.update(t.lower().strip() for t in chunk.evidence_tags if t)

        has_overlap = bool(f_tags.intersection(all_item_tags))
        if not has_overlap and f_tags:
            has_overlap = any(
                (ft in it or it in ft)
                for ft in f_tags
                for it in all_item_tags
            )

        if has_overlap:
            if item.evidence_id not in direct_tag_matches:
                direct_tag_matches.append(item.evidence_id)
        else:
            if item.evidence_id not in domain_matches:
                domain_matches.append(item.evidence_id)

    if f_tags:
        return direct_tag_matches[:limit]

    return domain_matches[:limit]


# ---------------------------------------------------------------------------
# Factor-Specific Action Templates & Deterministic Resolver
# ---------------------------------------------------------------------------

class FallbackActionTemplate:
    """Encapsulates a reviewed, conservative educational action template."""
    def __init__(
        self,
        title: str,
        description: str,
        domain: ReportDomain,
        rationale: str,
        timeframe: str,
        action_type: ActionType,
        evidence_tags: list[str],
    ):
        self.title = title
        self.description = description
        self.domain = domain
        self.rationale = rationale
        self.timeframe = timeframe
        self.action_type = action_type
        self.evidence_tags = evidence_tags


MOVEMENT_ACTION = FallbackActionTemplate(
    title="Take Regular Movement Breaks",
    description="Incorporate 5-minute walking or stretching breaks during prolonged desk work, and aim for 20 to 30 minutes of moderate activity most days.",
    domain="lifestyle_wellness",
    rationale="Regular light movement stimulates circulation and prevents prolonged physical inactivity.",
    timeframe="Start this week",
    action_type="lifestyle",
    evidence_tags=["sedentary_behavior", "physical_activity", "cardiovascular_fitness"],
)

SLEEP_ACTION = FallbackActionTemplate(
    title="Establish a Consistent Sleep Schedule",
    description="Aim to sleep and wake at similar times each day and limit bright screens 30 minutes before bed.",
    domain="lifestyle_wellness",
    rationale="Consistent sleep schedules promote restorative rest and cellular recovery.",
    timeframe="Next 2-4 weeks",
    action_type="lifestyle",
    evidence_tags=["sleep_duration", "circadian_rhythm", "recovery"],
)

HEAT_ACTION = FallbackActionTemplate(
    title="Use a Laptop Desk or Stand",
    description="Avoid resting warm laptops or heating devices directly on your lap or groin area.",
    domain="environmental_exposure",
    rationale="Keeping the groin area at a normal resting temperature supports optimal testicular comfort and function.",
    timeframe="Ongoing",
    action_type="lifestyle",
    evidence_tags=["device_heat", "hyperthermia", "scrotal_temperature"],
)

STRESS_ACTION = FallbackActionTemplate(
    title="Incorporate Daily Relaxation & Recovery Breaks",
    description="Dedicate 10 to 15 minutes each evening to quiet breathing, gentle walks, or unwinding without work devices.",
    domain="mental_behavioral_wellness",
    rationale="Lowering everyday sympathetic nervous tension supports autonomic recovery and restorative sleep.",
    timeframe="1-2 weeks",
    action_type="self_monitoring",
    evidence_tags=["stress", "autonomic_regulation", "cortisol", "mindfulness"],
)

TOBACCO_ACTION = FallbackActionTemplate(
    title="Plan Gradual Tobacco & Nicotine Reduction",
    description="Work toward reducing daily tobacco and nicotine use, and consult a healthcare provider for evidence-informed cessation resources.",
    domain="substance_medication",
    rationale="Reducing tobacco use supports vascular elasticity, microvascular circulation, and decreases oxidative stress.",
    timeframe="Next 1-3 months",
    action_type="lifestyle",
    evidence_tags=["tobacco", "nicotine", "tobacco_abstinence", "vascular_health"],
)

ALCOHOL_ACTION = FallbackActionTemplate(
    title="Moderate Alcohol Consumption",
    description="Keep alcohol consumption within conservative guidelines, including regular alcohol-free days during the week.",
    domain="substance_medication",
    rationale="Moderating alcohol supports liver function, restorative sleep architecture, and general physiological wellness.",
    timeframe="Next 2-4 weeks",
    action_type="lifestyle",
    evidence_tags=["alcohol", "alcohol_moderation", "metabolic_health"],
)

NUTRITION_ACTION = FallbackActionTemplate(
    title="Incorporate More Whole Foods & Daily Hydration",
    description="Add fresh fruits, leafy vegetables, or whole grains to meals and ensure steady hydration throughout the day.",
    domain="lifestyle_wellness",
    rationale="Antioxidant-rich whole foods and adequate hydration provide micronutrients that support cellular wellness.",
    timeframe="Next 2-4 weeks",
    action_type="lifestyle",
    evidence_tags=["dietary_antioxidants", "diet_quality", "hydration", "micronutrients"],
)

DIGITAL_ACTION = FallbackActionTemplate(
    title="Adopt Mindful Digital Consumption Boundaries",
    description="Set intentional limits on adult digital media and screen time, prioritizing offline recovery and restful routines.",
    domain="sexual_health",
    rationale="Balanced digital habits encourage realistic intimacy standards, healthy dopamine regulation, and reduced psychosexual stress.",
    timeframe="Next 2-4 weeks",
    action_type="self_monitoring",
    evidence_tags=["digital_habits", "behavioral_control", "media_expectations", "relational_intimacy"],
)

CLINICAL_HISTORY_ACTION = FallbackActionTemplate(
    title="Discuss Health History With a Healthcare Provider",
    description="Schedule an in-person routine consultation with a doctor or urologist to review your self-reported history.",
    domain="reproductive_health",
    rationale="In-person clinical evaluation provides physical examination and context that cannot be assessed through screening questionnaires.",
    timeframe="Next 1-3 months",
    action_type="professional_discussion",
    evidence_tags=["urology_consultation", "varicocele_screening", "reproductive_history"],
)

INTIMACY_ACTION = FallbackActionTemplate(
    title="Practice Compassionate Intimacy Communication",
    description="Engage in open, low-pressure conversations with your partner or a counselor regarding expectations and comfort.",
    domain="sexual_health",
    rationale="Taking a supportive, pressure-free approach reduces performance anxiety and enhances psychosexual wellbeing.",
    timeframe="Ongoing",
    action_type="education",
    evidence_tags=["performance_anxiety", "intimacy_confidence", "psychosexual_health"],
)

TOXIN_ACTION = FallbackActionTemplate(
    title="Reduce Ambient Chemical & Toxin Contact",
    description="Use appropriate protective equipment when handling chemicals and opt for glass or stainless-steel containers for food storage.",
    domain="environmental_exposure",
    rationale="Limiting exposure to industrial chemicals and plasticizers supports cellular wellness and endocrine protection.",
    timeframe="Ongoing",
    action_type="lifestyle",
    evidence_tags=["environmental_toxins", "endocrine_disruptors", "endocrine_protection"],
)

EXACT_FACTOR_ACTION_MAP: dict[str, FallbackActionTemplate] = {
    "sedentary_activity_level": MOVEMENT_ACTION,
    "low_physical_activity": MOVEMENT_ACTION,
    "short_sleep_duration": SLEEP_ACTION,
    "irregular_sleep": SLEEP_ACTION,
    "laptop_heat_exposure": HEAT_ACTION,
    "frequent_heat_exposure": HEAT_ACTION,
    "elevated_perceived_stress": STRESS_ACTION,
    "severe_perceived_stress": STRESS_ACTION,
    "elevated_mood_screening_proxy": STRESS_ACTION,
    "elevated_anxiety_screening_proxy": STRESS_ACTION,
    "tobacco_exposure": TOBACCO_ACTION,
    "smoking_habit": TOBACCO_ACTION,
    "alcohol_consumption": ALCOHOL_ACTION,
    "low_produce_intake": NUTRITION_ACTION,
    "frequent_processed_food": NUTRITION_ACTION,
    "low_hydration": NUTRITION_ACTION,
    "perceived_loss_of_control_digital": DIGITAL_ACTION,
    "difficulty_moderating_consumption": DIGITAL_ACTION,
    "digital_behavior_functional_impact": DIGITAL_ACTION,
    "high_daily_screen_time_adult_content": DIGITAL_ACTION,
    "digital_content_emotional_coping": DIGITAL_ACTION,
    "masturbation_control": DIGITAL_ACTION,
    "spectatoring_self_monitoring": DIGITAL_ACTION,
    "pornography_driven_performance_standard": DIGITAL_ACTION,
    "known_varicocele_history": CLINICAL_HISTORY_ACTION,
    "prior_sti_history": CLINICAL_HISTORY_ACTION,
    "scrotal_or_groin_injury": CLINICAL_HISTORY_ACTION,
    "childhood_disease_mumps": CLINICAL_HISTORY_ACTION,
    "ejaculation_concerns": CLINICAL_HISTORY_ACTION,
    "partnered_sexual_difficulty": INTIMACY_ACTION,
    "genital_self_image_concern": INTIMACY_ACTION,
    "libido_changes": INTIMACY_ACTION,
}

def resolve_fallback_action_template(factor_id: str) -> Optional[FallbackActionTemplate]:
    """Deterministically maps a factor ID or category to a reviewed conservative educational action."""
    f_id = factor_id.lower().strip()
    if f_id in EXACT_FACTOR_ACTION_MAP:
        return EXACT_FACTOR_ACTION_MAP[f_id]

    if "sedentary" in f_id or "physical_activity" in f_id or "exercise" in f_id:
        return MOVEMENT_ACTION
    if "sleep" in f_id:
        return SLEEP_ACTION
    if "heat" in f_id or "laptop" in f_id:
        return HEAT_ACTION
    if "stress" in f_id or "mood" in f_id or "anxiety" in f_id:
        return STRESS_ACTION
    if "tobacco" in f_id or "smoking" in f_id or "nicotine" in f_id:
        return TOBACCO_ACTION
    if "alcohol" in f_id:
        return ALCOHOL_ACTION
    if "produce" in f_id or "diet" in f_id or "processed" in f_id or "hydration" in f_id or "nutrition" in f_id:
        return NUTRITION_ACTION
    if "digital" in f_id or "pornograph" in f_id or "masturbat" in f_id or "spectator" in f_id or "screen_time" in f_id:
        return DIGITAL_ACTION
    if "varicocele" in f_id or "sti" in f_id or "mumps" in f_id or "injury" in f_id or "ejacul" in f_id:
        return CLINICAL_HISTORY_ACTION
    if "partner" in f_id or "libido" in f_id or "image" in f_id or "intimacy" in f_id:
        return INTIMACY_ACTION
    if "toxin" in f_id or "pesticide" in f_id or "chemical" in f_id or "plastic" in f_id:
        return TOXIN_ACTION

    return None


def humanize_factor_title(factor_id: str) -> str:
    """Converts internal factor IDs into friendly everyday titles."""
    mapping = {
        "sedentary_activity_level": "Daily Physical Activity",
        "elevated_perceived_stress": "Stress Management & Rest (Questionnaire Indicator)",
        "severe_perceived_stress": "Stress & Recovery (Questionnaire Indicator)",
        "laptop_heat_exposure": "Heat Exposure Around Groin Area",
        "frequent_heat_exposure": "Heat & Thermal Exposure",
        "short_sleep_duration": "Sleep Routine & Duration",
        "irregular_sleep": "Consistent Sleep Schedule",
        "low_produce_intake": "Fruit & Vegetable Intake",
        "low_hydration": "Daily Water Intake",
        "tobacco_exposure": "Tobacco & Nicotine Intake",
        "alcohol_consumption": "Alcohol Intake",
        "frequent_processed_food": "Everyday Nutrition Quality",
        "known_varicocele_history": "Varicocele History Review",
        "prior_sti_history": "Previous STI History Review",
        "scrotal_or_groin_injury": "Previous Groin or Scrotal Injury",
        "childhood_disease_mumps": "Childhood Health History",
        "ejaculation_concerns": "Ejaculation Pattern & Comfort",
        "libido_changes": "Libido & Desire Fluctuation",
        "masturbation_control": "Masturbation Habits & Mindfulness",
        "spectatoring_self_monitoring": "Performance Self-Monitoring & Comfort",
        "partnered_sexual_difficulty": "Partnered Intimacy & Sexual Comfort",
        "genital_self_image_concern": "Body Image & Intimacy Confidence",
        "pornography_driven_performance_standard": "Media-Influenced Intimacy Expectations",
        "elevated_mood_screening_proxy": "Mood Well-Being (Questionnaire Indicator)",
        "elevated_anxiety_screening_proxy": "Anxiety & Tension (Questionnaire Indicator)",
    }
    return mapping.get(factor_id, factor_id.replace("_", " ").title())


def humanize_factor_description(factor: FactorItem) -> str:
    """Produces clear, human-understandable explanations answering What, Why, and What to do."""
    f_id = factor.id
    if "sedentary" in f_id or "physical_activity" in f_id:
        return "Your answers suggest your daily routine involves long periods of sitting with limited movement. Regular physical activity supports cardiovascular circulation, energy levels, and overall wellness. Try incorporating 20 to 30 minutes of brisk walking or light exercise most days."
    if "stress" in f_id:
        return "You reported elevated daily stress levels on your questionnaire. Ongoing stress can affect sleep quality, energy, and overall health. Setting aside time for regular rest breaks, mindfulness, or relaxing hobbies can help restore balance."
    if "heat" in f_id or "laptop" in f_id:
        return "Frequent heat exposure (such as resting a laptop directly on your lap or frequent hot baths) can increase local temperature around the groin. Using a desk or laptop stand helps keep the area at a normal resting temperature."
    if "sleep" in f_id:
        return "Your sleep duration is shorter or less consistent than recommended for most adults. Aiming for 7 to 8 hours of restful, regular sleep each night supports daily recovery, hormone balance, and vitality."
    if "tobacco" in f_id:
        return "Your answers report tobacco or nicotine exposure. Reducing or eliminating tobacco use protects blood vessel health and reduces oxidative stress throughout the body."
    if "alcohol" in f_id:
        return "Moderate or frequent alcohol intake was noted. Moderating alcohol consumption supports restorative sleep, liver health, and overall physiological wellness."
    if "diet" in f_id or "processed" in f_id or "produce" in f_id:
        return "Your answers suggest opportunities to include more fresh whole foods. A diet rich in fresh vegetables, whole grains, and antioxidant-rich fruits helps support cellular health."
    if "varicocele" in f_id:
        return "You reported a diagnosed or suspected varicocele. A varicocele is an enlargement of veins within the scrotum that can affect local temperature. A routine evaluation with a urologist can help assess whether any ongoing monitoring is appropriate."
    if "sti" in f_id:
        return "You reported a history of a previous sexually transmitted infection. Many STIs are resolved effectively with treatment; discussing this history during a routine medical check-up ensures overall reproductive health."
    if "mumps" in f_id:
        return "You noted a history of childhood mumps. While common in childhood, discussing this with a doctor when planning a family is a helpful baseline practice."
    if "ejacul" in f_id:
        return "You reported concerns regarding ejaculation volume or comfort. Ejaculatory patterns can vary with hydration, frequency, and stress. A healthcare professional can provide guidance if this remains persistent."
    if "masturbat" in f_id or "pornograph" in f_id or "spectator" in f_id:
        return "Your responses reflect personal thoughts regarding intimacy habits or performance expectations. Normal sexual practices vary widely; taking a compassionate, pressure-free approach and reducing performance stress can support personal comfort."
    if "mood" in f_id or "anxiety" in f_id:
        return "Your brief screening indicator suggested mild to moderate tension or mood fluctuations. Brief questionnaire proxies provide personal context; speaking with a healthcare professional can provide valuable personalized support."

    # Fallback to reason with gentle tone
    return f"Your assessment highlighted this area for attention: {factor.reason}. Making gradual, positive adjustments to your daily routine can support your long-term health."


def humanize_positive_title(factor_id: str) -> str:
    """Converts internal positive factor IDs into encouraging titles."""
    mapping = {
        "adequate_produce_hydration": "Balanced Nutrition & Hydration",
        "non_smoker": "Tobacco-Free Lifestyle",
        "regular_physical_activity": "Regular Physical Exercise",
        "adequate_sleep": "Consistent Restful Sleep",
        "low_stress": "Healthy Stress Management",
        "healthy_bmi": "Healthy Weight Balance",
        "low_perceived_stress": "Resilient Stress Management",
    }
    return mapping.get(factor_id, factor_id.replace("_", " ").title())


def humanize_positive_description(factor: FactorItem) -> str:
    """Produces encouraging, evidence-grounded descriptions for positive habits."""
    f_id = factor.id
    if "produce" in f_id or "hydration" in f_id or "water" in f_id:
        return "You already report regular fruit and vegetable intake and good daily hydration. Maintaining this habit provides essential micronutrients and antioxidants that support cellular health."
    if "smok" in f_id or "tobacco" in f_id:
        return "You report no tobacco use. Staying smoke-free is a major protective factor that supports healthy circulation, vascular health, and overall vitality."
    if "exercise" in f_id or "activity" in f_id:
        return "You maintain regular physical activity, which strengthens cardiovascular health, stamina, and metabolic balance."
    if "sleep" in f_id:
        return "You get regular, sufficient sleep, giving your body the consistent rest it needs for recovery and hormonal regulation."
    if "stress" in f_id:
        return "Your self-reported stress indicators reflect balanced daily coping and recovery habits."

    return f"You reported positive habits in this area: {factor.reason}. Continuing this healthy routine supports your overall baseline wellness."


def build_fallback_report(
    normalized_assessment: NormalizedAssessment,
    health_context: HealthContext,
    evidence_context: EvidenceContext,
    metadata: ReportMetadata,
    error_note: str = "",
) -> MantraAIReport:
    """
    Constructs a deterministic, fully compliant MantraAIReport directly from
    the HealthContext and EvidenceContext when the LLM is unavailable or fails.
    Written in clear, compassionate, non-technical plain English.
    """
    # 1. Executive Summary Status
    mod_count = len(health_context.modifiable_factors)
    flag_count = len(health_context.follow_up_flags)
    
    if flag_count > 0 or mod_count >= 5:
        overall_status: WellnessStatus = "Several areas need attention"
    elif mod_count >= 2:
        overall_status = "Worth monitoring"
    else:
        overall_status = "Stable"

    # 2. Extract valid evidence IDs
    valid_ids = [e.evidence_id for e in evidence_context.items]

    # 3. Build Priority Factors from modifiable factors
    priority_factors: list[PriorityFactorReportItem] = []
    for idx, f in enumerate(health_context.modifiable_factors[:5]):
        source_q_ids = [q for q in f.source_question_ids if q in QUESTION_DOMAIN_MAP] or ["physical_activity_level"]
        norm_domain = normalize_report_domain(f.domain)
        f_refs = find_evidence_for_factor(
            evidence_context.items,
            factor_domain=f.domain,
            factor_tags=f.evidence_tags,
        )
        priority_factors.append(
            PriorityFactorReportItem(
                id=f"pf_{idx + 1}",
                domain=norm_domain,
                title=humanize_factor_title(f.id),
                description=humanize_factor_description(f),
                source_question_ids=source_q_ids,
                evidence_refs=f_refs[:2],
                actionable=True,
                severity="moderate",
            )
        )

    if not priority_factors:
        priority_factors.append(
            PriorityFactorReportItem(
                id="pf_baseline",
                domain="lifestyle_wellness",
                title="Routine Health Maintenance",
                description="Continue balanced lifestyle habits, good daily hydration, and regular physical activity to support your baseline wellness.",
                source_question_ids=["physical_activity_level"],
                evidence_refs=[],
                actionable=True,
                severity="low",
            )
        )

    # 4. Build Positive Factors
    positive_factors: list[PositiveFactorReportItem] = []
    for idx, p in enumerate(health_context.positive_factors[:5]):
        source_q_ids = [q for q in p.source_question_ids if q in QUESTION_DOMAIN_MAP] or ["age_years"]
        norm_domain = normalize_report_domain(p.domain)
        p_refs = find_evidence_for_factor(
            evidence_context.items,
            factor_domain=p.domain,
            factor_tags=p.evidence_tags,
        )
        positive_factors.append(
            PositiveFactorReportItem(
                id=f"pos_{idx + 1}",
                domain=norm_domain,
                title=humanize_positive_title(p.id),
                description=humanize_positive_description(p),
                source_question_ids=source_q_ids,
                evidence_refs=p_refs[:2],
            )
        )

    if not positive_factors:
        positive_factors.append(
            PositiveFactorReportItem(
                id="pos_baseline",
                domain="lifestyle_wellness",
                title="Proactive Health Engagement",
                description="Taking the time to complete this comprehensive health screening demonstrates proactive personal wellness engagement.",
                source_question_ids=["age_years"],
                evidence_refs=[],
            )
        )

    # 5. Build Action Plan with deterministic, factor-specific mapping
    personalized_actions: list[PersonalizedAction] = []
    seen_action_titles: set[str] = set()

    for f in health_context.modifiable_factors[:5]:
        tmpl = resolve_fallback_action_template(f.id)
        if tmpl and tmpl.title.lower() not in seen_action_titles:
            act_refs = find_evidence_for_factor(
                evidence_context.items,
                factor_domain=tmpl.domain,
                factor_tags=tmpl.evidence_tags,
            )
            personalized_actions.append(
                PersonalizedAction(
                    id=f"act_{len(personalized_actions) + 1}",
                    title=tmpl.title,
                    description=tmpl.description,
                    domain=tmpl.domain,
                    rationale=tmpl.rationale,
                    evidence_refs=act_refs[:2],
                    timeframe=tmpl.timeframe,
                    action_type=tmpl.action_type,
                    priority=len(personalized_actions) + 1,
                )
            )
            seen_action_titles.add(tmpl.title.lower())
            if len(personalized_actions) >= 3:
                break

    # If modifiable factors existed but none matched reviewed templates, provide clearly labeled educational fallback
    if not personalized_actions and health_context.modifiable_factors:
        first_mod = health_context.modifiable_factors[0]
        norm_domain = normalize_report_domain(first_mod.domain)
        personalized_actions.append(
            PersonalizedAction(
                id="act_1",
                title="Routine Health Discussion",
                description=f"Consider discussing {humanize_factor_title(first_mod.id)} with a qualified clinician for personalized educational guidance.",
                domain=norm_domain,
                rationale="Consulting a qualified healthcare provider ensures guidance is tailored to your individual medical context.",
                evidence_refs=[],
                timeframe="Next 1-3 months",
                action_type="professional_discussion",
                priority=1,
            )
        )

    if not personalized_actions:
        act_refs = find_evidence_for_domain(evidence_context.items, "lifestyle_wellness")
        personalized_actions.append(
            PersonalizedAction(
                id="act_baseline",
                title="Maintain Daily Wellness Routine",
                description="Continue balanced nutrition, regular hydration, and daily physical movement.",
                domain="lifestyle_wellness",
                rationale="Consistent daily habits support long-term physical stamina and metabolic wellness.",
                evidence_refs=act_refs[:2],
                timeframe="ongoing",
                action_type="lifestyle",
                priority=1,
            )
        )

    # 6. Clinician Questions & When to seek help
    clinician_questions: list[ClinicianDiscussionQuestion] = []
    for idx, flag in enumerate(health_context.follow_up_flags):
        norm_domain = normalize_report_domain(flag.domain)
        clinician_questions.append(
            ClinicianDiscussionQuestion(
                id=f"cq_{idx + 1}",
                question=f"What preventive steps or evaluations do you recommend regarding {flag.reason.lower()}?",
                domain=norm_domain,
                reason="Identified as an area for professional clinical discussion during screening.",
            )
        )

    if not clinician_questions:
        clinician_questions.append(
            ClinicianDiscussionQuestion(
                id="cq_routine",
                question="What daily lifestyle adjustments or routine screenings would you suggest based on my current health profile?",
                domain="reproductive_health",
                reason="Routine preventive wellness check-in.",
            )
        )

    when_to_seek_help: list[ProfessionalHelpGuidance] = []
    for flag in health_context.follow_up_flags:
        when_to_seek_help.append(
            ProfessionalHelpGuidance(
                trigger=f"Presence of persistent {flag.id.replace('_', ' ')}",
                explanation=flag.reason,
                urgency="timely",
            )
        )

    if not when_to_seek_help:
        when_to_seek_help.append(
            ProfessionalHelpGuidance(
                trigger="Persistent discomfort, new symptoms, or planning to start a family",
                explanation="Schedule an in-person consultation with a qualified healthcare professional for a complete clinical assessment.",
                urgency="routine",
            )
        )

    # 7. Evidence references
    evidence_references: list[EvidenceReference] = [
        EvidenceReference(
            evidence_id=e.evidence_id,
            title=e.title,
            source=e.source,
            year=e.publication_year,
            url=e.url,
            source_identifier=e.source_identifier,
            relevance=e.relevance_reason,
        )
        for e in evidence_context.items
    ]

    # 8. Report Metadata
    report_metadata = ReportMetadata(
        report_version="2.0",
        generated_at=metadata.generated_at or datetime.now(timezone.utc).isoformat(),
        model_provider="system_fallback",
        model_name="deterministic_fallback",
        questionnaire_version="1.0",
    )

    overview_text = (
        "Your answers suggest that you have several healthy habits already in place, while a few areas could benefit "
        "from proactive attention. The main areas to focus on include daily physical activity, sleep regularity, and everyday "
        "lifestyle habits. These findings do not mean that you have a medical condition; they simply highlight areas that may "
        "be worth improving or discussing with a healthcare professional."
    )

    return MantraAIReport(
        report_metadata=report_metadata,
        executive_summary=ExecutiveSummary(
            headline="Your Personalized Health & Wellness Summary",
            overview=overview_text,
            key_themes=["Daily Physical Activity & Rest", "Healthy Habits to Maintain", "Proactive Next Steps"],
            areas_for_attention=[humanize_factor_title(f.id) for f in health_context.modifiable_factors[:3]] or ["Maintain baseline wellness routines"],
            positive_context=[humanize_positive_title(p.id) for p in health_context.positive_factors[:3]] or ["Proactive health engagement"],
            overall_wellness_status=overall_status,
        ),
        reproductive_health=ReproductiveHealthReportSection(
            summary="A review of your self-reported history suggests an overall stable baseline, with opportunities to maintain general reproductive wellbeing.",
            reported_context=[f.reason for f in health_context.context_flags if "repro" in f.domain],
            relevant_factors=[f.reason for f in health_context.modifiable_factors if "repro" in f.domain],
            evidence_refs=find_evidence_for_domain(evidence_context.items, "reproductive_health"),
            limitations=["Questionnaire responses provide self-reported context only and do not replace laboratory semen analysis or physical examination."],
        ),
        sexual_health=SexualHealthReportSection(
            summary="Your responses indicate healthy psychosexual awareness. Remember that intimacy and energy naturally fluctuate with daily stress and sleep.",
            reported_context=[f.reason for f in health_context.context_flags if "sex" in f.domain],
            relevant_factors=[f.reason for f in health_context.modifiable_factors if "sex" in f.domain],
            evidence_refs=find_evidence_for_domain(evidence_context.items, "sexual_health"),
            limitations=["Sexual wellbeing reflects personal experience and normal physiological variability."],
        ),
        mental_behavioral_wellness=MentalBehavioralWellnessReportSection(
            summary="Managing everyday stress, balancing work hours, and maintaining restorative relaxation routines are important pillars of your overall health.",
            reported_context=[f.reason for f in health_context.context_flags if "mental" in f.domain or "stress" in f.domain],
            relevant_factors=[f.reason for f in health_context.modifiable_factors if "mental" in f.domain or "stress" in f.domain],
            evidence_refs=find_evidence_for_domain(evidence_context.items, "mental_behavioral_wellness"),
            limitations=["Brief screening indicators are informational and do not represent formal psychiatric diagnoses."],
        ),
        lifestyle_wellness=LifestyleWellnessReportSection(
            summary="Daily movement, consistent sleep schedules, and balanced hydration create a strong foundation for long-term physical vitality.",
            relevant_factors=[f.reason for f in health_context.modifiable_factors if "lifestyle" in f.domain],
            evidence_refs=find_evidence_for_domain(evidence_context.items, "lifestyle_wellness"),
            limitations=["Lifestyle assessments are based on self-reported estimates."],
        ),
        environmental_exposure=EnvironmentalExposureReportSection(
            summary="Minimizing prolonged direct heat around the groin and maintaining good ergonomic habits help protect your everyday comfort.",
            relevant_factors=[f.reason for f in health_context.modifiable_factors if "heat" in f.domain or "env" in f.domain],
            evidence_refs=find_evidence_for_domain(evidence_context.items, "environmental_exposure"),
            limitations=["Observational associations reflect general health patterns rather than direct individual outcomes."],
        ),
        substance_medication=SubstanceMedicationReportSection(
            summary="Maintaining a tobacco-free lifestyle and moderating substance exposure support healthy blood vessels and circulation.",
            relevant_factors=[f.reason for f in health_context.modifiable_factors if "substance" in f.domain or "med" in f.domain],
            evidence_refs=find_evidence_for_domain(evidence_context.items, "substance_medication"),
            limitations=["Medication and supplement reviews must always be conducted directly with prescribing physicians."],
        ),
        priority_factors=priority_factors,
        positive_factors=positive_factors,
        personalized_action_plan=personalized_actions,
        questions_to_discuss_with_clinician=clinician_questions,
        when_to_seek_professional_help=when_to_seek_help,
        evidence=evidence_references,
        limitations=ReportLimitations(
            summary="Assessment conducted via self-reported structured questionnaire.",
            methodology_notes=[
                "Educational screening utility only; does not provide clinical diagnosis.",
                "Does not replace laboratory semen analysis, hormonal profiling, or clinical imaging.",
            ],
            items=evidence_context.limitations_summary or [
                "Observational evidence reflects population-level guidelines rather than individual clinical certainty."
            ],
        ),
        disclaimer=(
            "MantraAI is an evidence-informed wellness and educational platform. This report does not constitute "
            "medical diagnosis, clinical prognosis, or treatment prescription. Always consult a qualified healthcare provider."
        ),
    )


# ===========================================================================
# Deterministic Report Enrichment & Completion
# ===========================================================================

def enrich_and_complete_report(
    report: MantraAIReport,
    health_context: HealthContext,
    evidence_context: EvidenceContext,
    normalized_assessment: NormalizedAssessment,
) -> MantraAIReport:
    """
    Guarantees that every section of the report is populated with rich, traceable,
    plain-language data derived from HealthContext and EvidenceContext:
    1. Ensures all retrieved evidence items are present in the evidence section.
    2. Ensures positive_factors contains at least 2-5 protective habits.
    3. Ensures priority_factors contains at least 2-5 actionable areas for attention.
    4. Ensures personalized_action_plan contains 3-5 concrete lifestyle action steps.
    5. Ensures questions_to_discuss_with_clinician contains 2-4 structured doctor discussion prompts.
    6. Ensures when_to_seek_professional_help contains 2-4 calibrated clinical indicators.
    7. Ensures all 6 domains have rich summaries and relevant factors.
    8. Ensures executive summary themes and attention areas match populated factors.
    """
    valid_ev_ids = [e.evidence_id for e in evidence_context.items]

    # 1. Evidence: ensure all retrieved evidence items are present with full metadata
    existing_ev_ids = {e.evidence_id for e in report.evidence}
    enriched_evidence = list(report.evidence)
    for e in evidence_context.items:
        if e.evidence_id not in existing_ev_ids:
            enriched_evidence.append(
                EvidenceReference(
                    evidence_id=e.evidence_id,
                    title=e.title,
                    source=e.source,
                    year=e.publication_year,
                    url=e.url,
                    source_identifier=e.source_identifier,
                    relevance=e.relevance_reason,
                )
            )
            existing_ev_ids.add(e.evidence_id)

    # 2. Positive Factors: enrich if completely empty
    enriched_positive = list(report.positive_factors)
    if not enriched_positive and health_context.positive_factors:
        for p in health_context.positive_factors:
            source_q_ids = [q for q in p.source_question_ids if q in QUESTION_DOMAIN_MAP] or ["age_years"]
            p_refs = find_evidence_for_factor(
                evidence_context.items,
                factor_domain=p.domain,
                factor_tags=p.evidence_tags,
            )
            enriched_positive.append(
                PositiveFactorReportItem(
                    id=f"pos_{len(enriched_positive) + 1}",
                    domain=normalize_report_domain(p.domain),
                    title=humanize_positive_title(p.id),
                    description=humanize_positive_description(p),
                    source_question_ids=source_q_ids,
                    evidence_refs=p_refs[:2],
                )
            )
            if len(enriched_positive) >= 5:
                break

    if not enriched_positive:
        enriched_positive.append(
            PositiveFactorReportItem(
                id="pos_baseline",
                domain="lifestyle_wellness",
                title="Proactive Health Engagement",
                description="Taking the time to complete this comprehensive screening demonstrates proactive engagement with personal wellness.",
                source_question_ids=["age_years"],
                evidence_refs=[],
            )
        )

    # 3. Priority Factors: enrich if completely empty and modifiable factors exist
    enriched_priority = list(report.priority_factors)
    if not enriched_priority and health_context.modifiable_factors:
        for f in health_context.modifiable_factors:
            source_q_ids = [q for q in f.source_question_ids if q in QUESTION_DOMAIN_MAP] or ["physical_activity_level"]
            f_refs = find_evidence_for_factor(
                evidence_context.items,
                factor_domain=f.domain,
                factor_tags=f.evidence_tags,
            )
            enriched_priority.append(
                PriorityFactorReportItem(
                    id=f"pf_{len(enriched_priority) + 1}",
                    domain=normalize_report_domain(f.domain),
                    title=humanize_factor_title(f.id),
                    description=humanize_factor_description(f),
                    source_question_ids=source_q_ids,
                    evidence_refs=f_refs[:2],
                    actionable=True,
                    severity="moderate",
                )
            )
            if len(enriched_priority) >= 5:
                break

    if not enriched_priority:
        enriched_priority.append(
            PriorityFactorReportItem(
                id="pf_baseline",
                domain="lifestyle_wellness",
                title="Routine Health Maintenance",
                description="Continue balanced lifestyle habits, good daily hydration, and regular physical activity to support your baseline wellness.",
                source_question_ids=["physical_activity_level"],
                evidence_refs=[],
                actionable=True,
                severity="low",
            )
        )

    # 4. Action Plan: enrich if completely empty using deterministic factor mapping
    enriched_actions = list(report.personalized_action_plan)
    if not enriched_actions:
        existing_act_titles = {a.title.lower() for a in enriched_actions}
        for f in health_context.modifiable_factors[:5]:
            tmpl = resolve_fallback_action_template(f.id)
            if tmpl and tmpl.title.lower() not in existing_act_titles:
                act_refs = find_evidence_for_factor(
                    evidence_context.items,
                    factor_domain=tmpl.domain,
                    factor_tags=tmpl.evidence_tags,
                )
                enriched_actions.append(
                    PersonalizedAction(
                        id=f"act_{len(enriched_actions) + 1}",
                        title=tmpl.title,
                        description=tmpl.description,
                        domain=tmpl.domain,
                        rationale=tmpl.rationale,
                        evidence_refs=act_refs[:2],
                        timeframe=tmpl.timeframe,
                        action_type=tmpl.action_type,
                        priority=len(enriched_actions) + 1,
                    )
                )
                existing_act_titles.add(tmpl.title.lower())
                if len(enriched_actions) >= 4:
                    break

        if not enriched_actions and health_context.modifiable_factors:
            first_mod = health_context.modifiable_factors[0]
            enriched_actions.append(
                PersonalizedAction(
                    id="act_1",
                    title="Routine Health Discussion",
                    description=f"Consider discussing {humanize_factor_title(first_mod.id)} with a qualified clinician for personalized educational guidance.",
                    domain=normalize_report_domain(first_mod.domain),
                    rationale="Consulting a qualified healthcare provider ensures guidance is tailored to your individual medical context.",
                    evidence_refs=[],
                    timeframe="Next 1-3 months",
                    action_type="professional_discussion",
                    priority=1,
                )
            )

        if not enriched_actions:
            act_refs = find_evidence_for_domain(evidence_context.items, "lifestyle_wellness")
            enriched_actions.append(
                PersonalizedAction(
                    id="act_baseline",
                    title="Maintain Daily Wellness Routine",
                    description="Continue balanced nutrition, regular hydration, and daily physical movement.",
                    domain="lifestyle_wellness",
                    rationale="Consistent daily habits support long-term physical stamina and metabolic wellness.",
                    evidence_refs=act_refs[:2],
                    timeframe="ongoing",
                    action_type="lifestyle",
                    priority=1,
                )
            )

    # 5. Clinician Discussion Questions: enrich if completely empty
    enriched_questions = list(report.questions_to_discuss_with_clinician)
    if not enriched_questions:
        existing_q_texts = {q.question.lower() for q in enriched_questions}
        for flag in health_context.follow_up_flags:
            q_text = f"What preventive evaluations or lifestyle adjustments do you suggest regarding {flag.reason.lower()}?"
            if q_text.lower() not in existing_q_texts:
                enriched_questions.append(
                    ClinicianDiscussionQuestion(
                        id=f"cq_{len(enriched_questions) + 1}",
                        question=q_text,
                        domain=normalize_report_domain(flag.domain),
                        reason=f"Identified from reported history: {flag.reason}",
                    )
                )
                existing_q_texts.add(q_text.lower())

        if not enriched_questions:
            default_qs = [
                ("What routine preventive health screenings or blood tests are appropriate for my age group and lifestyle?", "reproductive_health", "Routine wellness maintenance."),
                ("How might my daily work hours and stress levels be affecting my overall vitality and rest?", "mental_behavioral_wellness", "Stress and recovery review."),
            ]
            for q_t, q_d, q_r in default_qs:
                if q_t.lower() not in existing_q_texts:
                    enriched_questions.append(
                        ClinicianDiscussionQuestion(
                            id=f"cq_{len(enriched_questions) + 1}",
                            question=q_t,
                            domain=q_d,
                            reason=q_r,
                        )
                    )
                    existing_q_texts.add(q_t.lower())
                    if len(enriched_questions) >= 3:
                        break

    # 6. When to Seek Professional Help: enrich if completely empty
    enriched_help = list(report.when_to_seek_professional_help)
    if not enriched_help:
        existing_triggers = {h.trigger.lower() for h in enriched_help}
        for flag in health_context.follow_up_flags:
            trig = f"Persistent {flag.id.replace('_', ' ')} or related discomfort"
            if trig.lower() not in existing_triggers:
                enriched_help.append(
                    ProfessionalHelpGuidance(
                        trigger=trig,
                        explanation=f"A formal clinical evaluation is advised to review {flag.reason.lower()}.",
                        urgency="timely",
                    )
                )
                existing_triggers.add(trig.lower())

        if not enriched_help:
            default_helps = [
                ("Persistent discomfort, pain, or palpable changes in the groin area", "Schedule an in-person physical examination with a physician or urologist.", "timely"),
                ("Planning a family or experiencing prolonged difficulties with intimacy or rest", "A qualified reproductive specialist can conduct appropriate baseline diagnostic assessments.", "routine"),
            ]
            for h_t, h_e, h_u in default_helps:
                if h_t.lower() not in existing_triggers:
                    enriched_help.append(
                        ProfessionalHelpGuidance(
                            trigger=h_t,
                            explanation=h_e,
                            urgency=h_u,
                        )
                    )
                    existing_triggers.add(h_t.lower())
                    if len(enriched_help) >= 3:
                        break

    # 7. Domain sections: verify relevant_factors, reported_context, evidence_refs
    rep = report.reproductive_health
    rep_factors = rep.relevant_factors or [f.reason for f in health_context.modifiable_factors if "repro" in f.domain]
    rep_context = rep.reported_context or [f.reason for f in health_context.context_flags if "repro" in f.domain]
    rep_valid = [r for r in rep.evidence_refs if r in valid_ev_ids]
    rep_refs = rep_valid if rep_valid else find_evidence_for_domain(evidence_context.items, "reproductive_health")
    rep_summary = rep.summary if rep.summary and len(rep.summary) > 20 else (
        "No specific reproductive concerns were identified from the answers provided in this area."
        if not rep_factors and not rep_context else
        "A review of your self-reported history indicates overall stable baseline parameters with opportunities for routine health maintenance."
    )

    sex = report.sexual_health
    sex_factors = sex.relevant_factors or [f.reason for f in health_context.modifiable_factors if "sex" in f.domain]
    sex_context = sex.reported_context or [f.reason for f in health_context.context_flags if "sex" in f.domain]
    sex_valid = [r for r in sex.evidence_refs if r in valid_ev_ids]
    sex_refs = sex_valid if sex_valid else find_evidence_for_domain(evidence_context.items, "sexual_health")
    sex_summary = sex.summary if sex.summary and len(sex.summary) > 20 else (
        "No specific psychosexual concerns were identified from your assessment responses."
        if not sex_factors and not sex_context else
        "Your responses reflect normal psychosexual awareness. Energy and intimacy naturally fluctuate with daily stress, fatigue, and recovery."
    )

    men = report.mental_behavioral_wellness
    men_factors = men.relevant_factors or [f.reason for f in health_context.modifiable_factors if "mental" in f.domain or "stress" in f.domain or "psych" in f.domain]
    men_context = men.reported_context or [f.reason for f in health_context.context_flags if "mental" in f.domain or "stress" in f.domain]
    men_valid = [r for r in men.evidence_refs if r in valid_ev_ids]
    men_refs = men_valid if men_valid else find_evidence_for_domain(evidence_context.items, "mental_behavioral_wellness")
    men_summary = men.summary if men.summary and len(men.summary) > 20 else (
        "No elevated stress or sleep challenges were reported in this screening."
        if not men_factors and not men_context else
        "Managing everyday stress, balancing screen habits, and protecting regular sleep routines are central to your overall wellbeing."
    )

    life = report.lifestyle_wellness
    life_factors = life.relevant_factors or [f.reason for f in health_context.modifiable_factors if "lifestyle" in f.domain or "sleep" in f.domain or "diet" in f.domain]
    life_valid = [r for r in life.evidence_refs if r in valid_ev_ids]
    life_refs = life_valid if life_valid else find_evidence_for_domain(evidence_context.items, "lifestyle_wellness")
    life_summary = life.summary if life.summary and len(life.summary) > 20 else (
        "Your responses indicate solid baseline daily lifestyle habits."
        if not life_factors else
        "Daily physical movement, balanced nutrition, and consistent hydration form the core pillars of physical vitality."
    )

    env = report.environmental_exposure
    env_factors = env.relevant_factors or [f.reason for f in health_context.modifiable_factors if "env" in f.domain or "heat" in f.domain]
    env_valid = [r for r in env.evidence_refs if r in valid_ev_ids]
    env_refs = env_valid if env_valid else find_evidence_for_domain(evidence_context.items, "environmental_exposure")
    env_summary = env.summary if env.summary and len(env.summary) > 20 else (
        "No significant environmental heat or chemical exposures were identified."
        if not env_factors else
        "Minimizing direct heat around the groin and maintaining good ergonomic desk habits support long-term physical comfort."
    )

    sub = report.substance_medication
    sub_factors = sub.relevant_factors or [f.reason for f in health_context.modifiable_factors if "substance" in f.domain or "med" in f.domain or "alcohol" in f.domain or "tobacco" in f.domain]
    sub_valid = [r for r in sub.evidence_refs if r in valid_ev_ids]
    sub_refs = sub_valid if sub_valid else find_evidence_for_domain(evidence_context.items, "substance_medication")
    sub_summary = sub.summary if sub.summary and len(sub.summary) > 20 else (
        "No tobacco, alcohol escalation, or unmonitored substance exposures were reported."
        if not sub_factors else
        "Maintaining a smoke-free lifestyle and moderating substance exposure protect vascular elasticity and circulation."
    )

    # 8. Executive summary themes and attention areas
    exec_s = report.executive_summary
    themes = exec_s.key_themes or ["Daily Movement & Rest", "Protective Baseline Habits", "Evidence-Informed Next Steps"]
    areas = exec_s.areas_for_attention or [p.title for p in enriched_priority[:3]]
    pos_ctx = exec_s.positive_context or [p.title for p in enriched_positive[:3]]

    enriched_report = MantraAIReport(
        report_metadata=report.report_metadata,
        executive_summary=ExecutiveSummary(
            headline=exec_s.headline,
            overview=exec_s.overview,
            key_themes=themes,
            areas_for_attention=areas,
            positive_context=pos_ctx,
            overall_wellness_status=exec_s.overall_wellness_status,
        ),
        reproductive_health=ReproductiveHealthReportSection(
            summary=rep_summary,
            reported_context=rep_context,
            relevant_factors=rep_factors,
            evidence_refs=rep_refs,
            limitations=rep.limitations or ["Questionnaire screening context only."],
        ),
        sexual_health=SexualHealthReportSection(
            summary=sex_summary,
            reported_context=sex_context,
            relevant_factors=sex_factors,
            evidence_refs=sex_refs,
            limitations=sex.limitations or ["Psychosexual wellness reflects subjective self-reported context."],
        ),
        mental_behavioral_wellness=MentalBehavioralWellnessReportSection(
            summary=men_summary,
            reported_context=men_context,
            relevant_factors=men_factors,
            evidence_refs=men_refs,
            limitations=men.limitations or ["Screening indicators do not constitute psychiatric evaluation."],
        ),
        lifestyle_wellness=LifestyleWellnessReportSection(
            summary=life_summary,
            relevant_factors=life_factors,
            evidence_refs=life_refs,
            limitations=life.limitations or ["Self-reported daily lifestyle estimates."],
        ),
        environmental_exposure=EnvironmentalExposureReportSection(
            summary=env_summary,
            relevant_factors=env_factors,
            evidence_refs=env_refs,
            limitations=env.limitations or ["Observational associations only."],
        ),
        substance_medication=SubstanceMedicationReportSection(
            summary=sub_summary,
            relevant_factors=sub_factors,
            evidence_refs=sub_refs,
            limitations=sub.limitations or ["Always consult prescribing doctors regarding medications."],
        ),
        priority_factors=enriched_priority,
        positive_factors=enriched_positive,
        personalized_action_plan=enriched_actions,
        questions_to_discuss_with_clinician=enriched_questions,
        when_to_seek_professional_help=enriched_help,
        evidence=enriched_evidence,
        limitations=report.limitations,
        disclaimer=report.disclaimer,
    )

    return enriched_report


# ===========================================================================
# HTTP Client Request Execution
# ===========================================================================

def execute_groq_request(
    system_prompt: str,
    user_prompt: str,
    api_key: str,
    model: str,
    repair_feedback: Optional[str] = None,
    timeout_seconds: float = 45.0,
) -> str:
    """
    Executes a synchronous HTTP POST request to Groq's chat completions endpoint.
    Extracts rate-limit header information upon 429 for intelligent backoff.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
    }

    effective_user_prompt = user_prompt
    if repair_feedback:
        effective_user_prompt += (
            f"\n\nCRITICAL FIX: The previous output had a validation issue ({repair_feedback}). "
            "Ensure ALL 16 sections (including limitations, evidence, positive_factors, personalized_action_plan, and disclaimer) "
            "are present, non-empty, and strictly valid JSON matching the schema."
        )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": effective_user_prompt},
    ]

    payload = {
        "model": model,
        "messages": messages,
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 4000,
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        GROQ_COMPLETIONS_URL,
        data=req_data,
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout_seconds) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            choices = res_json.get("choices", [])
            if not choices:
                raise ReportConnectionError("Groq response contained no completion choices.")
            content = choices[0].get("message", {}).get("content", "")
            return content

    except urllib.error.HTTPError as e:
        status_code = e.code
        if status_code in (401, 403):
            raise ReportAuthError(f"Groq API authentication failed (HTTP {status_code}).") from e
        elif status_code == 429:
            retry_after_sec: Optional[float] = None
            retry_hdr = e.headers.get("retry-after") or e.headers.get("Retry-After")
            if retry_hdr:
                try:
                    retry_after_sec = float(retry_hdr)
                except (ValueError, TypeError):
                    pass

            if retry_after_sec is None:
                reset_tokens_hdr = e.headers.get("x-ratelimit-reset-tokens")
                if reset_tokens_hdr:
                    try:
                        val_str = reset_tokens_hdr.strip()
                        if val_str.endswith("ms"):
                            retry_after_sec = float(val_str[:-2]) / 1000.0
                        elif val_str.endswith("s"):
                            retry_after_sec = float(val_str[:-1])
                        elif val_str.endswith("m"):
                            retry_after_sec = float(val_str[:-1]) * 60.0
                        else:
                            retry_after_sec = float(val_str)
                    except (ValueError, TypeError):
                        pass

            raise ReportRateLimitError(
                f"Groq API rate limit exceeded (HTTP 429).",
                retry_after_seconds=retry_after_sec,
            ) from e
        else:
            raise ReportConnectionError(f"Groq API HTTP error {status_code}: {e.reason}") from e

    except urllib.error.URLError as e:
        raise ReportConnectionError(f"Groq API connection error: {str(e.reason)}") from e

    except TimeoutError as e:
        raise ReportConnectionError(f"Groq API request timed out after {timeout_seconds}s.") from e

    except Exception as e:
        raise ReportConnectionError(f"Unexpected error communicating with Groq API: {str(e)}") from e


# ===========================================================================
# Main Report Generation Orchestrator
# ===========================================================================

def generate_mantra_report(
    normalized_assessment: NormalizedAssessment,
    health_context: HealthContext,
    evidence_context: EvidenceContext,
    metadata: Optional[ReportMetadata] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    max_attempts: int = MAX_REPORT_ATTEMPTS,
    allow_external_ai: bool = True,
) -> MantraAIReport:
    """
    High-level orchestrator that synthesizes a validated MantraAIReport.
    Guarantees 100% complete sections and strict schema compliance.
    """
    resolved_api_key = api_key if api_key is not None else settings.GROQ_API_KEY
    resolved_model = model or settings.GROQ_MODEL or "openai/gpt-oss-120b"

    if metadata is None:
        metadata = ReportMetadata(
            report_version="2.0",
            generated_at=datetime.now(timezone.utc).isoformat(),
            model_provider="groq" if allow_external_ai else "deterministic_fallback",
            model_name=resolved_model if allow_external_ai else "deterministic_guideline_engine",
            questionnaire_version="1.0",
        )

    # If external AI is not allowed (e.g. no THIRD_PARTY_AI_ANALYSIS consent) or no API key is configured,
    # immediately return safe deterministic fallback without transmitting health data to Groq.
    if not allow_external_ai or not resolved_api_key or not resolved_api_key.strip():
        logger.info(
            "External AI synthesis disabled or not configured (allow_external_ai=%s, api_key_present=%s). "
            "Generating deterministic fallback report (evidence matched: %d).",
            allow_external_ai,
            bool(resolved_api_key and resolved_api_key.strip()),
            evidence_context.matched_count,
        )
        fb = build_fallback_report(
            normalized_assessment=normalized_assessment,
            health_context=health_context,
            evidence_context=evidence_context,
            metadata=metadata,
        )
        return enrich_and_complete_report(
            report=fb,
            health_context=health_context,
            evidence_context=evidence_context,
            normalized_assessment=normalized_assessment,
        )

    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(
        normalized_assessment=normalized_assessment,
        health_context=health_context,
        evidence_context=evidence_context,
        metadata=metadata,
    )

    last_error: Optional[Exception] = None
    repair_feedback: Optional[str] = None
    start_time = time.time()

    for attempt in range(1, max_attempts + 1):
        attempt_start = time.time()
        logger.info(
            "Starting report generation attempt %d/%d (model: %s, evidence count: %d).",
            attempt,
            max_attempts,
            resolved_model,
            evidence_context.matched_count,
        )

        try:
            raw_content = execute_groq_request(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                api_key=resolved_api_key,
                model=resolved_model,
                repair_feedback=repair_feedback,
            )

            report = validate_report_content(
                raw_content=raw_content,
                evidence_context=evidence_context,
            )

            # Guarantee complete section population and deterministic enrichment
            report = enrich_and_complete_report(
                report=report,
                health_context=health_context,
                evidence_context=evidence_context,
                normalized_assessment=normalized_assessment,
            )

            duration_ms = int((time.time() - attempt_start) * 1000)
            logger.info(
                "Report generation succeeded on attempt %d in %dms (version: %s, sections validated: 16).",
                attempt,
                duration_ms,
                report.report_metadata.report_version,
            )
            return report

        except ReportAuthError as e:
            # Non-retryable authentication failure
            logger.error("Groq API authentication failed on attempt %d: %s. Halting retries.", attempt, str(e))
            last_error = e
            break

        except ReportRateLimitError as e:
            last_error = e
            retry_wait = getattr(e, "retry_after_seconds", None)
            safe_wait = min(max(retry_wait, 2.0) if retry_wait is not None else (2.0 * (2 ** (attempt - 1))), 12.0)
            logger.warning(
                "Groq API rate limit reached on attempt %d/%d (model: %s, backing off for %.1fs).",
                attempt,
                max_attempts,
                resolved_model,
                safe_wait,
            )
            if attempt < max_attempts:
                time.sleep(safe_wait)

        except ReportConnectionError as e:
            logger.warning("Groq API connection error on attempt %d: %s. Retrying.", attempt, str(e))
            last_error = e
            if attempt < max_attempts:
                time.sleep(1.0 * attempt)

        except (MalformedReportJSONError, ReportValidationError, InvalidEvidenceReferenceError, InvalidQuestionIdError) as e:
            logger.warning(
                "Report validation failed on attempt %d (%s): %s.",
                attempt,
                type(e).__name__,
                str(e)[:200],
            )
            last_error = e
            repair_feedback = f"{type(e).__name__}: {str(e)}"
            if attempt < max_attempts:
                time.sleep(0.5)

        except Exception as e:
            logger.error("Unexpected error during report generation attempt %d: %s", attempt, str(e))
            last_error = e
            if attempt < max_attempts:
                time.sleep(1.0)

    total_duration_ms = int((time.time() - start_time) * 1000)
    logger.error(
        "All %d report generation attempts failed in %dms. Last error: %s. Falling back to deterministic report.",
        max_attempts,
        total_duration_ms,
        str(last_error),
    )

    fb = build_fallback_report(
        normalized_assessment=normalized_assessment,
        health_context=health_context,
        evidence_context=evidence_context,
        metadata=metadata,
    )
    return enrich_and_complete_report(
        report=fb,
        health_context=health_context,
        evidence_context=evidence_context,
        normalized_assessment=normalized_assessment,
    )
