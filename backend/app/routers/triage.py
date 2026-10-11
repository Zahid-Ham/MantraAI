"""API Router for Red-Flag Triage Screening.

Provides deterministic clinical triage endpoints before assessment initiation.
Only audit tier metadata is recorded; raw symptom answers are never persisted or logged.
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.audit import AuditEvent
from app.services.triage import evaluate_triage, TriageEvaluation
from app.constants.triage_copy import TRIAGE_QUESTIONS

router = APIRouter(prefix="/api/v1/triage", tags=["Triage"])


class TriageSubmissionRequest(BaseModel):
    answers: Dict[str, bool] = Field(
        ...,
        description="Dictionary mapping triage question IDs to boolean positive/negative answers."
    )


class TriageQuestionOut(BaseModel):
    id: str
    order: int
    text_en: str
    tier: str
    description: str


class TriageSubmissionResponse(BaseModel):
    tier: str
    message_key: str
    title: str
    message: str
    helpline: Optional[str]
    timeframe: str
    can_continue: bool
    triggered_flag_count: int


@router.get("/questions", response_model=List[TriageQuestionOut])
def get_triage_questions(current_user: User = Depends(get_current_user)):
    """Retrieve the red-flag screening questions shown prior to the full assessment."""
    return TRIAGE_QUESTIONS


@router.post("", response_model=TriageSubmissionResponse)
def submit_triage_screening(
    payload: TriageSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates acute red flags against authored clinical triage protocols.
    Persists only the resulting urgency tier in audit_events for safety monitoring.
    Raw answers are never stored or logged in database.
    """
    evaluation = evaluate_triage(payload.answers)

    # Persist ONLY the tier in audit_events (strictly preserving user privacy)
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="triage_completed",
        event_metadata={"tier": evaluation.tier},
    )
    db.add(audit)
    db.commit()

    return TriageSubmissionResponse(
        tier=evaluation.tier,
        message_key=evaluation.message_key,
        title=evaluation.title,
        message=evaluation.message,
        helpline=evaluation.helpline,
        timeframe=evaluation.timeframe,
        can_continue=evaluation.can_continue,
        triggered_flag_count=evaluation.triggered_flag_count,
    )
