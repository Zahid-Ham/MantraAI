"""Deterministic Red-Flag Clinical Triage Service.

Evaluates acute red-flag symptoms before the full 86-item assessment.
Maps reported flags to clinical urgency tiers with authored, non-diagnostic guidance.
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

from app.schemas.report import UrgencyLevel
from app.constants.triage_copy import (
    TRIAGE_QUESTIONS,
    TRIAGE_TIER_MESSAGES,
    CLINICIAN_REVIEW_REQUIRED,
)

# Severity hierarchy for determining highest priority red-flag tier
TIER_PRIORITY: Dict[str, int] = {
    "emergency": 5,
    "crisis": 4,
    "urgent": 3,
    "prompt": 2,
    "timely": 1,
    "routine": 0,
}


class TriageEvaluation(BaseModel):
    tier: UrgencyLevel = Field(..., description="Highest urgency tier triggered by red flags.")
    message_key: str = Field(..., description="Key identifying the authored copy block.")
    title: str = Field(..., description="Display title for user communication.")
    message: str = Field(..., description="Deterministic authored clinical safety copy.")
    helpline: Optional[str] = Field(None, description="Relevant emergency or crisis hotline.")
    timeframe: str = Field(..., description="Recommended medical timeframe.")
    can_continue: bool = Field(True, description="Whether the user is permitted to continue assessment.")
    triggered_flag_count: int = Field(0, description="Total count of positive red-flag symptoms.")


def evaluate_triage(answers: Dict[str, bool]) -> TriageEvaluation:
    """
    Evaluates yes/no answers to red-flag screening questions.
    Returns the highest-priority urgency tier and associated authored copy.
    Does NOT store or expose raw answers.
    """
    highest_priority = 0
    selected_tier: UrgencyLevel = "routine"
    triggered_count = 0

    question_map = {q["id"]: q for q in TRIAGE_QUESTIONS}

    for q_id, val in answers.items():
        if val is True and q_id in question_map:
            triggered_count += 1
            item_tier = question_map[q_id]["tier"]
            priority = TIER_PRIORITY.get(item_tier, 0)
            if priority > highest_priority:
                highest_priority = priority
                selected_tier = item_tier

    copy_data = TRIAGE_TIER_MESSAGES.get(selected_tier, TRIAGE_TIER_MESSAGES["routine"])

    return TriageEvaluation(
        tier=selected_tier,
        message_key=selected_tier,
        title=copy_data["title"],
        message=copy_data["message"],
        helpline=copy_data.get("helpline"),
        timeframe=copy_data["timeframe"],
        can_continue=copy_data.get("can_continue", True),
        triggered_flag_count=triggered_count,
    )
