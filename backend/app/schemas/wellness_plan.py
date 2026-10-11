from datetime import date as DateType, datetime as DateTimeType
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.health import AdaptiveGoalOut


class EvidenceSourceOut(BaseModel):
    """Authoritative citation provenance for a wellness recommendation."""
    model_config = ConfigDict(from_attributes=True)

    evidence_id: str
    title: str
    source: str
    organization: Optional[str] = None
    year: Optional[int] = None
    url: str
    source_identifier: str
    relevance: str


class WellnessActionLogOut(BaseModel):
    """Daily tracking record for a wellness action."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    action_item_id: UUID
    date: DateType
    status: str  # "completed", "skipped", "postponed"
    notes: Optional[str] = None
    logged_at: DateTimeType


class WellnessActionItemOut(BaseModel):
    """Personalized wellness action item."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan_id: UUID
    action_key: str
    title: str
    explanation: str
    domain: str
    frequency: str
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    start_date: DateType
    status: str  # "active", "paused", "dismissed", "completed"
    evidence_sources: List[EvidenceSourceOut] = Field(default_factory=list)
    evidence_sufficiency: str = "sufficient"
    is_from_assessment: bool = False
    priority: int = 1
    today_status: Optional[str] = None  # None, "completed", "skipped", "postponed"
    today_log: Optional[WellnessActionLogOut] = None
    created_at: DateTimeType
    updated_at: DateTimeType


class WellnessPlanOut(BaseModel):
    """Master wellness plan schema."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    assessment_session_id: Optional[UUID] = None
    title: str
    status: str
    focus_areas: List[str] = Field(default_factory=list)
    clinical_disclaimer: str
    is_baseline_educational: bool
    action_items: List[WellnessActionItemOut] = Field(default_factory=list)
    created_at: DateTimeType
    updated_at: DateTimeType


class WellnessActionLogCreate(BaseModel):
    """Request payload to log today's progress on an action item."""
    status: str = Field(..., description="Action log status: 'completed', 'skipped', or 'postponed'")
    date: Optional[DateType] = Field(None, description="Calendar date (defaults to today)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional personal note")


class WellnessActionStatusUpdate(BaseModel):
    """Request payload to change action state (pause, resume, dismiss)."""
    status: str = Field(..., description="Action item state: 'active', 'paused', 'dismissed', or 'completed'")


class WeeklyAdherenceStats(BaseModel):
    """Weekly self-reported habit adherence summary."""
    start_date: DateType
    end_date: DateType
    total_scheduled_actions: int = 0
    completed_count: int = 0
    skipped_count: int = 0
    postponed_count: int = 0
    completion_rate_pct: float = 0.0
    streak_days: int = 0
    disclaimer: str = (
        "Completion rates reflect self-reported routine adherence, not clinical fertility or medical health status."
    )


class PlannerDashboardOut(BaseModel):
    """Consolidated dashboard view integrating personalized actions and adaptive goals."""
    plan: Optional[WellnessPlanOut] = None
    today_actions: List[WellnessActionItemOut] = Field(default_factory=list)
    upcoming_actions: List[WellnessActionItemOut] = Field(default_factory=list)
    paused_or_dismissed_actions: List[WellnessActionItemOut] = Field(default_factory=list)
    adaptive_goals: List[AdaptiveGoalOut] = Field(default_factory=list)
    weekly_stats: WeeklyAdherenceStats
    has_assessment: bool = False
    assessment_date: Optional[DateTimeType] = None
    educational_guidance: str = (
        "Educational wellness recommendations are evidence-informed habits based on clinical guidelines. "
        "They are not clinical diagnoses or treatment prescriptions. "
        "Seek medical evaluation if experiencing acute or severe symptoms."
    )

