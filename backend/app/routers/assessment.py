import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List, Dict, Any

from app.database import get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report
from app.models.audit import AuditEvent
from app.schemas.assessment import (
    AssessmentSessionCreate,
    AssessmentSessionOut,
    AssessmentResponseSave,
    AssessmentResultOut,
    ReportOut,
)
from app.services.normalizer import normalize_assessment_responses
from app.services.context_engine import build_health_context
from app.services.evidence_retriever import retrieve_evidence_for_health_context
from app.services.report_generator import generate_mantra_report
from app.schemas.report import new_report_to_legacy_view

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/assessments", tags=["assessments"])

@router.post("", response_model=AssessmentSessionOut)
def create_assessment_session(
    payload: AssessmentSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if there is an in-progress assessment to avoid spamming
    existing = db.query(AssessmentSession).filter(
        AssessmentSession.user_id == current_user.id,
        AssessmentSession.status == "IN_PROGRESS"
    ).first()
    
    if existing:
        # Return existing in-progress session so they can resume it
        return existing

    session = AssessmentSession(
        user_id=current_user.id,
        assessment_version=payload.assessment_version or "1.0",
        status="IN_PROGRESS",
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Log audit event
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="ASSESSMENT_STARTED",
        event_metadata={"assessment_session_id": str(session.id)}
    )
    db.add(audit)
    db.commit()

    return session

@router.get("", response_model=List[AssessmentSessionOut])
def get_assessment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Returns history ordered by started_at descending
    sessions = db.query(AssessmentSession).filter(
        AssessmentSession.user_id == current_user.id
    ).order_by(AssessmentSession.started_at.desc()).all()
    return sessions

@router.get("/{assessment_id}", response_model=AssessmentSessionOut)
def get_assessment_session(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    # Enforce strict user isolation
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access to this assessment is unauthorized.")

    return session

@router.patch("/{assessment_id}", response_model=AssessmentSessionOut)
def update_assessment_session_status(
    assessment_id: UUID,
    status_val: str,  # IN_PROGRESS, COMPLETED, ABANDONED
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if status_val not in ["IN_PROGRESS", "COMPLETED", "ABANDONED"]:
        raise HTTPException(status_code=422, detail="Invalid status value.")

    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    session.status = status_val
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session

@router.get("/{assessment_id}/responses")
def get_responses(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    responses = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_session_id == assessment_id
    ).all()

    return {"responses": {r.question_id: r.response_value for r in responses}}

@router.post("/{assessment_id}/responses")
def save_responses(
    assessment_id: UUID,
    payload: AssessmentResponseSave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    if session.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Cannot edit a completed or abandoned assessment.")

    # Progressive Upsert: save responses progressively
    for q_id, q_val in payload.responses.items():
        existing_resp = db.query(AssessmentResponse).filter(
            AssessmentResponse.assessment_session_id == assessment_id,
            AssessmentResponse.question_id == q_id
        ).first()

        if existing_resp:
            existing_resp.response_value = q_val
            existing_resp.updated_at = datetime.utcnow()
        else:
            new_resp = AssessmentResponse(
                assessment_session_id=assessment_id,
                question_id=q_id,
                response_value=q_val
            )
            db.add(new_resp)
            
    db.commit()
    return {"status": "ok", "saved_count": len(payload.responses)}

# Backward-compatible helper executing the structured report generator pipeline
def generate_report_via_groq(answers: dict) -> dict:
    norm = normalize_assessment_responses(answers)
    ctx = build_health_context(norm)
    ev = retrieve_evidence_for_health_context(ctx)
    rep = generate_mantra_report(norm, ctx, ev)
    rep_dict = rep.model_dump(mode="json")
    legacy_dict = new_report_to_legacy_view(rep)
    return {**rep_dict, **legacy_dict}

@router.post("/{assessment_id}/complete", response_model=AssessmentResultOut)
def complete_assessment(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    if session.status == "COMPLETED":
        # Already completed, just return existing result
        res = db.query(AssessmentResult).filter(
            AssessmentResult.assessment_session_id == assessment_id
        ).first()
        if res:
            return res

    # 1. Fetch all responses in DB for this session
    responses_list = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_session_id == assessment_id
    ).all()

    answers = {r.question_id: r.response_value for r in responses_list}

    # ── CONTEXT ENGINE PIPELINE ──────────────────────────────────────────
    # 1. Normalize raw questionnaire responses across all canonical domains
    normalized_context = normalize_assessment_responses(answers)

    # 2. Build structured, deterministic health context
    health_context = build_health_context(normalized_context)

    # 3. Retrieve matching authoritative clinical evidence
    evidence_context = retrieve_evidence_for_health_context(health_context)
    logger.debug(
        "Assessment %s evidence retrieved: %d guidelines/reviews matched across query tags.",
        str(assessment_id),
        evidence_context.matched_count,
    )

    # 3. Derive backward-compatible, non-diagnostic result summary
    # NOTE: Obsolete scoring based on legacy field names (stress_level, sleep_hours, etc.)
    # is replaced by the deterministic domain factor counts and clinical boundaries.
    lifestyle_mod_count = len([f for f in health_context.modifiable_factors if f.domain == "lifestyle_wellness"])
    mental_mod_count = len([f for f in health_context.modifiable_factors if f.domain == "mental_behavioral_wellness"])
    reproductive_flags_count = len([f for f in health_context.context_flags if f.domain == "reproductive_health"])
    total_score = len(health_context.modifiable_factors) + len(health_context.follow_up_flags)

    if len(health_context.follow_up_flags) > 0 or total_score >= 6:
        overall_cat = "Several areas need attention"
        interpretation = "Multiple contextual factors suggest areas for proactive optimization and clinical consultation."
    elif total_score >= 3:
        overall_cat = "Worth monitoring"
        interpretation = "Some contextual factors indicate areas worth monitoring or optimizing through lifestyle and environmental adjustments."
    else:
        overall_cat = "Stable"
        interpretation = "Your responses suggest a stable baseline across lifestyle, environmental, and behavioral wellness domains."

    # 4. Create AssessmentResult record
    result = AssessmentResult(
        assessment_session_id=assessment_id,
        overall_category=overall_cat,
        risk_scores={
            "lifestyle": lifestyle_mod_count,
            "mental_health": mental_mod_count,
            "reproductive_risk": reproductive_flags_count,
            "total_score": total_score,
            "modifiable_factors_count": len(health_context.modifiable_factors),
            "positive_factors_count": len(health_context.positive_factors),
            "context_flags_count": len(health_context.context_flags),
            "follow_up_flags_count": len(health_context.follow_up_flags),
            "completeness": health_context.data_quality.completeness,
        },
        interpretation=interpretation
    )
    db.add(result)

    # 4. Generate & store validated MantraAIReport
    mantra_report = generate_mantra_report(
        normalized_assessment=normalized_context,
        health_context=health_context,
        evidence_context=evidence_context,
    )

    report_dict = mantra_report.model_dump(mode="json")
    legacy_view = new_report_to_legacy_view(mantra_report)
    persisted_content = {**legacy_view, **report_dict}

    report = Report(
        assessment_session_id=assessment_id,
        report_version=mantra_report.report_metadata.report_version,
        model_provider=mantra_report.report_metadata.model_provider,
        model_name=mantra_report.report_metadata.model_name,
        report_content=persisted_content,
        structured_findings=[f.model_dump() for f in mantra_report.priority_factors]
    )
    db.add(report)

    # 5. Mark session status as completed
    session.status = "COMPLETED"
    session.completed_at = datetime.utcnow()
    session.updated_at = datetime.utcnow()

    # Log audit event
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="ASSESSMENT_COMPLETED",
        event_metadata={"assessment_session_id": str(session.id)}
    )
    db.add(audit)

    db.commit()
    db.refresh(result)
    return result

@router.get("/{assessment_id}/results", response_model=AssessmentResultOut)
def get_assessment_results(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    result = db.query(AssessmentResult).filter(
        AssessmentResult.assessment_session_id == assessment_id
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Assessment results not compiled yet.")
    
    return result

@router.get("/{assessment_id}/report")
def get_assessment_report(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    report = db.query(Report).filter(
        Report.assessment_session_id == assessment_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="AI report not generated for this assessment.")

    # Return report content dictionary
    return report.report_content
