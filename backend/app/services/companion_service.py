"""
MantraAI — AI Health Companion Conversational Service
=====================================================

PURPOSE
-------
Provides an evidence-grounded, private, educational conversational layer for men's
reproductive and general health.

CORE RESPONSIBILITIES
---------------------
1. Validates incoming message payload and enforces strict user conversation ownership.
2. Maintains bounded conversation history to control token context.
3. Detects urgent symptoms (acute testicular pain, torsion, severe trauma, emergency crisis)
   and provides immediate, non-diagnostic safety escalation.
4. Deterministically extracts query concepts and retrieves authoritative clinical evidence
   from both the guideline evidence corpus and the canonical Myth vs Fact knowledge base.
5. Injects optional, non-PII personalized context from the user's latest assessment when requested.
6. Calls Groq LLM using JSON mode via `execute_groq_request` (no duplicate LLM clients).
7. Validates LLM responses against strict Pydantic schemas, forbidding diagnoses, fake scores,
   prescriptions, or fabricated evidence IDs.
8. Falls back deterministically to indexed guideline excerpts if the LLM provider is unavailable.
9. Persists conversations and messages under the authenticated user's ID.
"""

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.models.companion import CompanionConversation, CompanionMessage
from app.models.user import User
from app.models.assessment import AssessmentResult, Report
from app.models.myth_fact import MythFactClaim, MythFactSource
from app.schemas.companion import (
    ChatRequest,
    ChatResponse,
    CompanionSourceReference,
    CompanionMessageOut,
    ConversationSummary,
    ConversationDetail,
    CompanionLLMOutput,
    FORBIDDEN_COMPANION_FIELDS,
)
from app.services.evidence_retriever import retrieve_evidence, EvidenceContext, EvidenceItem
from app.services.myth_fact_service import (
    extract_keywords,
    find_canonical_match,
    resolve_sources_for_claim,
)
from app.services.report_generator import execute_groq_request

logger = logging.getLogger(__name__)

DEFAULT_COMPANION_DISCLAIMER = (
    "MantraAI Health Companion is an educational health intelligence assistant. "
    "It does not provide medical diagnosis, calculate fertility probabilities, or prescribe treatments. "
    "Always consult a qualified healthcare professional for medical concerns."
)

MAX_BOUNDED_HISTORY_MESSAGES = 6  # Limit previous message turns sent to LLM

# Urgent clinical symptom escalation triggers
URGENT_ESCALATION_PATTERNS = [
    (r"\b(severe|acute|sudden|extreme)\s+(testicular|testicle|scrotal|scrotum|groin)\s+pain\b", "acute_testicular_pain"),
    (r"\b(testicular|testicle)\s+torsion\b", "testicular_torsion"),
    (r"\b(twisted|swollen|black\s+and\s+blue)\s+(testicle|testicles|scrotum)\b", "acute_scrotal_swelling"),
    (r"\b(popping|crack|snap)\s+(sound\s+in|during\s+erection|penis)\b", "penile_fracture_risk"),
    (r"\b(peeing|urinary|urine|ejaculat\w*)\s+(heavy|large\s+clots\s+of|lots\s+of)\s+blood\b", "gross_hematuria"),
    (r"\b(kill\s+myself|suicide|suicidal|end\s+my\s+life)\b", "mental_health_crisis"),
]


def check_urgent_symptoms(message: str) -> Optional[Tuple[str, str]]:
    """
    Scans user input for acute emergency symptoms that require urgent professional evaluation.
    Returns (reason, escalation_response_text) or None.
    """
    msg_lower = message.lower()

    for pattern, reason in URGENT_ESCALATION_PATTERNS:
        if re.search(pattern, msg_lower):
            if reason == "mental_health_crisis":
                return (
                    reason,
                    "If you are feeling overwhelmed, hopeless, or having thoughts of self-harm, please reach out for immediate help. "
                    "You are not alone. Please contact a crisis hotline immediately:\n\n"
                    "- India Tele-MANAS: 14416 or 1800-891-4416 (Toll-Free, 24/7)\n"
                    "- Vandrevala Foundation Helpline: +91 9999 666 555\n"
                    "- AASRA: +91 98204 66726\n"
                    "- In the US/Canada: 988 Suicide & Crisis Lifeline\n\n"
                    "Please connect with a mental health professional or emergency service right now.",
                )
            elif reason in {"acute_testicular_pain", "testicular_torsion", "acute_scrotal_swelling"}:
                return (
                    reason,
                    "Sudden, severe testicular or scrotal pain is a medical emergency that requires immediate in-person evaluation. "
                    "Conditions such as testicular torsion require urgent clinical attention within a few hours to protect blood flow and testicular health. "
                    "Please do not wait or attempt home remedies—go to the nearest emergency room or consult a urologist immediately.",
                )
            elif reason == "penile_fracture_risk":
                return (
                    reason,
                    "A popping sound accompanied by rapid loss of erection, severe pain, or rapid swelling is a potential sign of acute penile injury (such as penile fracture). "
                    "This requires immediate emergency evaluation by a urologist or emergency department. Please seek urgent care without delay.",
                )
            elif reason == "gross_hematuria":
                return (
                    reason,
                    "Noticing heavy blood or blood clots in urine or semen warrants prompt medical evaluation by a urologist or general physician to determine the cause. "
                    "Please seek timely clinical care at an urgent care center or clinic.",
                )

    return None


def get_user_conversation(
    conversation_id: UUID,
    user_id: UUID,
    db: Session,
) -> CompanionConversation:
    """
    Fetches a conversation and guarantees strict user isolation.
    Raises 404 if not found or not owned by user.
    """
    conv = db.query(CompanionConversation).filter(
        CompanionConversation.id == conversation_id,
        CompanionConversation.user_id == user_id,
    ).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access unauthorized.",
        )
    return conv


def extract_personalized_health_context(user_id: UUID, db: Session) -> Optional[str]:
    """
    Extracts high-level, non-PII health context from the user's latest assessment report.
    Returns a sanitized plain-text summary or None.
    """
    # Look for latest completed assessment result
    res = (
        db.query(AssessmentResult)
        .filter(AssessmentResult.user_id == user_id)
        .order_by(AssessmentResult.completed_at.desc())
        .first()
    )
    if not res:
        return None

    # Check latest report
    rep = (
        db.query(Report)
        .filter(Report.assessment_id == res.session_id)
        .order_by(Report.generated_at.desc())
        .first()
    )

    context_lines = []
    if rep and isinstance(rep.report_json, dict):
        exec_s = rep.report_json.get("executive_summary", {})
        themes = exec_s.get("key_themes", [])
        if themes:
            context_lines.append(f"Previously reported focus areas: {', '.join(themes[:3])}.")
        areas = exec_s.get("areas_for_attention", [])
        if areas:
            context_lines.append(f"Lifestyle factors monitored: {', '.join(areas[:2])}.")

    if not context_lines and res.scores:
        scores = res.scores if isinstance(res.scores, dict) else {}
        domains = [k.replace("_", " ").title() for k, v in scores.items() if v]
        if domains:
            context_lines.append(f"Screening domains assessed: {', '.join(domains[:3])}.")

    if context_lines:
        return (
            "USER-REPORTED ASSESSMENT BACKGROUND (Educational context only; does not establish medical diagnosis):\n"
            + "\n".join(context_lines)
        )
    return None


def gather_evidence_for_query(
    query: str,
    db: Session,
) -> Tuple[List[CompanionSourceReference], str, str]:
    """
    Retrieves evidence from both the evidence corpus and the canonical Myth vs Fact database.
    Returns (sources, evidence_sufficiency, primary_domain).
    """
    sources: List[CompanionSourceReference] = []
    domain = "general_health"

    # 1. Check for canonical Myth vs Fact match
    canonical_match = find_canonical_match(query, db)
    if canonical_match:
        claim, match_type, conf_score, _ = canonical_match
        domain = claim.domain or "general_health"
        source_objs = resolve_sources_for_claim(claim.evidence_source_ids or [], db)
        for s in source_objs:
            sources.append(
                CompanionSourceReference(
                    source_id=s.source_id,
                    title=s.source_title,
                    organization=s.source_id.split("_")[0] if "_" in s.source_id else "Clinical Guideline",
                    url=s.source_url,
                    relevance_excerpt=claim.explanation[:250],
                )
            )

    # 2. Extract keywords and query authoritative clinical evidence corpus
    keywords = extract_keywords(query)
    ev_context: EvidenceContext = retrieve_evidence(keywords, top_k=3)

    if ev_context.items:
        # Determine predominant domain
        if ev_context.domain_distribution:
            top_domain = max(ev_context.domain_distribution.items(), key=lambda x: x[1])[0]
            if domain == "general_health":
                domain = top_domain

        for item in ev_context.items:
            # Avoid duplicate sources
            if not any(s.source_id == item.evidence_id or s.source_id == item.document_id for s in sources):
                sources.append(
                    CompanionSourceReference(
                        source_id=item.evidence_id,
                        title=item.title,
                        organization=item.organization or item.source,
                        publication_year=item.publication_year,
                        url=item.url,
                        relevance_excerpt=item.excerpt[:300],
                    )
                )

    # Determine evidence sufficiency
    if len(sources) >= 2:
        sufficiency = "sufficient"
    elif len(sources) == 1:
        sufficiency = "partial"
    else:
        sufficiency = "insufficient"

    return sources[:4], sufficiency, domain


def build_companion_system_prompt() -> str:
    """
    Authoritative system prompt enforcing clinical safety, empathetic tone,
    evidence-grounding, and strict forbidden field prevention.
    """
    return """You are the MantraAI AI Health Companion, an evidence-grounded educational health assistant specializing in men's health, reproductive wellness, lifestyle factors, and sexual wellbeing in India.

YOUR MISSION:
Provide clear, compassionate, evidence-informed answers to men's health questions in plain English. Your tone is warm, respectful, destigmatizing, and non-judgmental.

STRICT MEDICAL & SAFETY RULES (NON-NEGOTIABLE):
1. NOT A DOCTOR / NON-DIAGNOSTIC: You NEVER diagnose medical conditions (e.g. do not diagnose infertility, erectile dysfunction, varicocele, low testosterone, or STIs).
2. NO FERTILITY PROBABILITIES: You NEVER calculate or state fertility percentages, chances, or scores (e.g., never say "your fertility is 85%").
3. NO PRESCRIPTIONS: You NEVER recommend specific prescription drugs, hormone treatments, drug dosages, or steroid regimens. Always advise consulting a qualified clinician.
4. NO SHAME OR MORAL JUDGMENT: Address sexual health, masturbation, porn, and performance concerns neutrally and empathetically. Never use words like 'abnormal', 'dirty', 'weak', or 'addicted'.
5. EVIDENCE GROUNDING: Ground your answer strictly in the provided EVIDENCE ITEMS. Only cite evidence IDs that are explicitly provided in the input. If evidence is limited or insufficient, acknowledge the limitation openly and warmly.
6. NO FABRICATED CITATIONS: Never invent authors, guideline titles, DOIs, PMIDs, or URLs.
7. EDUCATIONAL ESCALATION: When symptoms warrant clinical attention, advise discussing them with a physician or urologist without inducing panic.

OUTPUT FORMAT:
Return a single valid JSON object strictly matching this schema:
{
  "answer": "Warm, clear, evidence-grounded answer in 2-4 well-structured paragraphs.",
  "cited_evidence_ids": ["exact_id_from_provided_evidence"],
  "evidence_sufficiency": "sufficient" | "partial" | "insufficient",
  "domain": "reproductive_health" | "sexual_health" | "lifestyle" | "hormones" | "environment_heat" | "general_health",
  "suggested_followups": ["Question 1 that user might want to ask next", "Question 2", "Question 3"]
}"""


def build_companion_user_prompt(
    current_message: str,
    bounded_history: List[Dict[str, str]],
    sources: List[CompanionSourceReference],
    personalized_context: Optional[str] = None,
) -> str:
    """Constructs user prompt with history, retrieved evidence, and current message."""
    sections = []

    if personalized_context:
        sections.append(personalized_context)

    if bounded_history:
        history_str = "\n".join(
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in bounded_history
        )
        sections.append(f"CONVERSATION HISTORY (Most recent turns):\n{history_str}")

    if sources:
        evidence_str = "\n".join(
            f"- [{s.source_id}] {s.title} ({s.organization or 'Clinical Guideline'}): {s.relevance_excerpt or 'Standard clinical guidance'}"
            for s in sources
        )
        sections.append(f"AUTHORITATIVE RETRIEVED EVIDENCE:\n{evidence_str}")
    else:
        sections.append("AUTHORITATIVE RETRIEVED EVIDENCE:\nNo specific indexed guidelines found for this query.")

    sections.append(f"USER QUERY:\n{current_message}")
    sections.append("Produce the structured JSON response according to system instructions.")

    return "\n\n".join(sections)


def generate_deterministic_fallback_response(
    query: str,
    sources: List[CompanionSourceReference],
    domain: str,
    sufficiency: str,
) -> CompanionLLMOutput:
    """
    Produces a safe, deterministic, evidence-grounded answer when the LLM service
    is offline, times out, or fails.
    """
    if sources:
        top_s = sources[0]
        answer = (
            f"Based on clinical guidance from {top_s.organization or top_s.title}, "
            f"here is the evidence regarding your question:\n\n"
            f"{top_s.relevance_excerpt or 'Authoritative clinical consensus emphasizes balanced lifestyle factors, routine health screening, and evidence-informed guidance.'}\n\n"
            f"Health parameters vary significantly between individuals. For personalized medical evaluation or specific symptoms, "
            f"consulting a qualified healthcare professional or urologist is recommended."
        )
        cited_ids = [top_s.source_id]
    else:
        answer = (
            "Current indexed clinical guidelines do not have specific evidence regarding this query. "
            "Men's reproductive and sexual health depends on multiple interrelated biological, lifestyle, and psychological factors. "
            "If you are experiencing specific symptoms or personal concerns, we recommend discussing them directly with a qualified healthcare provider."
        )
        cited_ids = []
        sufficiency = "insufficient"

    followups = [
        "What lifestyle habits support reproductive health?",
        "What questions should I ask during a routine checkup?",
        "How do sleep and stress affect testosterone?",
    ]

    return CompanionLLMOutput(
        answer=answer,
        cited_evidence_ids=cited_ids,
        evidence_sufficiency=sufficiency,
        domain=domain,
        suggested_followups=followups,
    )


def process_chat_message(
    request: ChatRequest,
    user: User,
    db: Session,
) -> ChatResponse:
    """
    Core entry point for sending a message to the AI Health Companion.
    """
    message_text = request.message.strip()

    # 1. Resolve or create conversation
    if request.conversation_id:
        conversation = get_user_conversation(request.conversation_id, user.id, db)
    else:
        # Generate short title from query
        clean_title = message_text.split("\n")[0][:45]
        if len(message_text) > 45:
            clean_title += "..."
        conversation = CompanionConversation(
            user_id=user.id,
            title=clean_title or "Health Discussion",
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 2. Check for urgent emergency symptoms
    escalation = check_urgent_symptoms(message_text)
    if escalation:
        reason, escalation_text = escalation

        # Save user message
        user_msg = CompanionMessage(
            conversation_id=conversation.id,
            role="user",
            content=message_text,
        )
        db.add(user_msg)

        # Save assistant escalation message
        asst_msg = CompanionMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=escalation_text,
            sources=[],
            evidence_sufficiency="sufficient",
            review_status="CLINICAL_SAFETY_ESCALATION",
            domain="emergency_safety",
            is_escalation=True,
            escalation_reason=reason,
            disclaimer=DEFAULT_COMPANION_DISCLAIMER,
            suggested_followups=["How to find the nearest emergency healthcare center?"],
        )
        db.add(asst_msg)
        conversation.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(asst_msg)

        return ChatResponse(
            conversation_id=conversation.id,
            message_id=asst_msg.id,
            answer=escalation_text,
            sources=[],
            evidence_sufficiency="sufficient",
            review_status="CLINICAL_SAFETY_ESCALATION",
            domain="emergency_safety",
            is_escalation=True,
            escalation_reason=reason,
            disclaimer=DEFAULT_COMPANION_DISCLAIMER,
            suggested_followups=["How to find the nearest emergency healthcare center?"],
            created_at=asst_msg.created_at,
        )

    # 3. Retrieve Evidence & Context
    sources, sufficiency, domain = gather_evidence_for_query(message_text, db)
    valid_source_ids = {s.source_id for s in sources}

    # 4. Optional Personalized Health Context
    personalized_context = None
    if request.include_health_context:
        personalized_context = extract_personalized_health_context(user.id, db)

    # 5. Load Bounded Conversation History
    prev_messages = (
        db.query(CompanionMessage)
        .filter(CompanionMessage.conversation_id == conversation.id)
        .order_by(CompanionMessage.created_at.desc())
        .limit(MAX_BOUNDED_HISTORY_MESSAGES)
        .all()
    )
    # Reverse to chronological order
    bounded_history = [
        {"role": m.role, "content": m.content[:500]}
        for m in reversed(prev_messages)
        if m.role in {"user", "assistant"}
    ]

    # 6. LLM Synthesis via Groq or Deterministic Fallback
    llm_output: Optional[CompanionLLMOutput] = None
    resolved_api_key = settings.GROQ_API_KEY
    resolved_model = settings.GROQ_MODEL

    if resolved_api_key and resolved_api_key.strip():
        system_prompt = build_companion_system_prompt()
        user_prompt = build_companion_user_prompt(
            current_message=message_text,
            bounded_history=bounded_history,
            sources=sources,
            personalized_context=personalized_context,
        )

        try:
            raw_response = execute_groq_request(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                api_key=resolved_api_key,
                model=resolved_model,
                timeout_seconds=25.0,
            )
            raw_json = json.loads(raw_response)

            # Strip any forbidden fields
            cleaned_json = {
                k: v for k, v in raw_json.items()
                if k.lower() not in FORBIDDEN_COMPANION_FIELDS
            }
            llm_output = CompanionLLMOutput.model_validate(cleaned_json)
        except Exception as e:
            logger.warning("Groq AI Companion completion failed (%s). Falling back to deterministic synthesis.", str(e))

    if not llm_output:
        llm_output = generate_deterministic_fallback_response(
            query=message_text,
            sources=sources,
            domain=domain,
            sufficiency=sufficiency,
        )

    # 7. Filter cited evidence IDs (prevent fabricated/unsupplied IDs)
    filtered_cited_sources = [
        s for s in sources
        if s.source_id in llm_output.cited_evidence_ids or s.source_id in valid_source_ids
    ]
    if not filtered_cited_sources and sources and llm_output.evidence_sufficiency != "insufficient":
        filtered_cited_sources = sources[:2]

    # Convert sources to serializable dicts for JSONB persistence
    sources_json = [s.model_dump() for s in filtered_cited_sources]

    # 8. Persist Turn (User Message + Assistant Message)
    user_msg = CompanionMessage(
        conversation_id=conversation.id,
        role="user",
        content=message_text,
    )
    db.add(user_msg)

    asst_msg = CompanionMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=llm_output.answer,
        sources=sources_json,
        evidence_sufficiency=llm_output.evidence_sufficiency,
        review_status="AI_SYNTHESIZED_UNREVIEWED",
        domain=llm_output.domain or domain,
        is_escalation=False,
        escalation_reason=None,
        disclaimer=DEFAULT_COMPANION_DISCLAIMER,
        suggested_followups=llm_output.suggested_followups[:3],
    )
    db.add(asst_msg)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(asst_msg)

    return ChatResponse(
        conversation_id=conversation.id,
        message_id=asst_msg.id,
        answer=llm_output.answer,
        sources=filtered_cited_sources,
        evidence_sufficiency=llm_output.evidence_sufficiency,
        review_status="AI_SYNTHESIZED_UNREVIEWED",
        domain=llm_output.domain or domain,
        is_escalation=False,
        escalation_reason=None,
        disclaimer=DEFAULT_COMPANION_DISCLAIMER,
        suggested_followups=llm_output.suggested_followups[:3],
        created_at=asst_msg.created_at,
    )


def list_user_conversations(
    user_id: UUID,
    db: Session,
    limit: int = 30,
) -> List[ConversationSummary]:
    """Lists conversations owned by the user, ordered by most recently updated."""
    convs = (
        db.query(CompanionConversation)
        .filter(CompanionConversation.user_id == user_id)
        .order_by(CompanionConversation.updated_at.desc())
        .limit(limit)
        .all()
    )

    summaries = []
    for c in convs:
        msg_count = len(c.messages)
        last_msg = c.messages[-1].content[:60] if c.messages else None
        summaries.append(
            ConversationSummary(
                id=c.id,
                title=c.title,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=msg_count,
                last_message_preview=last_msg,
            )
        )
    return summaries


def get_conversation_details(
    conversation_id: UUID,
    user_id: UUID,
    db: Session,
) -> ConversationDetail:
    """Returns full conversation details with message history."""
    conv = get_user_conversation(conversation_id, user_id, db)

    messages_out = []
    for m in conv.messages:
        # Parse sources
        src_objs = []
        if isinstance(m.sources, list):
            for s in m.sources:
                if isinstance(s, dict):
                    src_objs.append(CompanionSourceReference(**s))
        
        messages_out.append(
            CompanionMessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                sources=src_objs,
                evidence_sufficiency=m.evidence_sufficiency,
                review_status=m.review_status,
                domain=m.domain,
                is_escalation=m.is_escalation,
                escalation_reason=m.escalation_reason,
                disclaimer=m.disclaimer,
                suggested_followups=m.suggested_followups or [],
                created_at=m.created_at,
            )
        )

    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages_out,
    )


def delete_user_conversation(
    conversation_id: UUID,
    user_id: UUID,
    db: Session,
) -> Dict[str, Any]:
    """Deletes a conversation and its messages with ownership check."""
    conv = get_user_conversation(conversation_id, user_id, db)
    db.delete(conv)
    db.commit()
    return {"status": "success", "deleted_conversation_id": str(conversation_id)}
