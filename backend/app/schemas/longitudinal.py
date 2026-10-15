"""
MantraAI — Strict Longitudinal Assessment Comparison Schema
=============================================================

PURPOSE
-------
Defines the strict Pydantic output schemas for comparing multiple completed
assessments over time.

CLINICAL & SAFETY BOUNDARIES
----------------------------
- Strictly observational and non-diagnostic.
- Forbids overall numerical health scores, fertility percentages, or semen predictions.
- Forbids claims of medical cure or causal attribution (e.g., asserting a habit change cured a symptom).
- Uses calibrated, cautious clinical phrasing ("no longer reported in this assessment" instead of "cured").
- Distinguishes missing answers from negative answers.
- Discloses questionnaire version discrepancies.
"""

from datetime import datetime
from typing import Any, List, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

# ---------------------------------------------------------------------------
# Forbidden Fields Blacklist
# ---------------------------------------------------------------------------
FORBIDDEN_LONGITUDINAL_FIELDS: set[str] = {
    "fertility_probability",
    "infertility_probability",
    "fertility_percentage",
    "infertility_percentage",
    "fertility_score",
    "infertility_score",
    "health_score",
    "improvement_score",
    "improvement_percentage",
    "overall_score",
    "diagnosis",
    "diagnosed_condition",
    "disease_probability",
    "medical_cure",
    "semen_count_prediction",
    "semen_motility_prediction",
    "semen_morphology_prediction",
    "pregnancy_probability",
    "chance_of_conception",
}

# ---------------------------------------------------------------------------
# Controlled Types & Literals
# ---------------------------------------------------------------------------
ComparisonType = Literal[
    "PREVIOUS_COMPLETED",
    "USER_SELECTED",
    "BASELINE_ONLY",
]

SchemaCompatibility = Literal[
    "FULLY_COMPATIBLE",
    "VERSION_MISMATCH_PARTIAL",
    "INCOMPATIBLE",
]

FactorTransitionType = Literal[
    "NEWLY_REPORTED",
    "NO_LONGER_REPORTED",
    "PERSISTENT",
    "POSITIVE_ADOPTED",
    "POSITIVE_MAINTAINED",
    "POSITIVE_LAPSED",
    "NEWLY_RECORDED_CONTEXT",
    "HISTORICAL_CONDITION_NOT_RECORDED",
]

ReportDomainKey = Literal[
    "reproductive_health",
    "sexual_health",
    "mental_behavioral_wellness",
    "lifestyle_wellness",
    "environmental_exposure",
    "substance_medication",
]


# ---------------------------------------------------------------------------
# Comparison Metadata
# ---------------------------------------------------------------------------
class ComparisonMetadata(BaseModel):
    """Metadata describing the two assessment snapshots being compared."""
    model_config = ConfigDict(extra="forbid")

    current_assessment_id: UUID = Field(..., description="ID of the assessment being inspected.")
    current_completed_at: Optional[datetime] = Field(None, description="Completion timestamp of the current assessment.")
    current_assessment_version: str = Field(..., description="Schema version of the current assessment.")

    comparison_target_id: Optional[UUID] = Field(None, description="ID of the baseline/previous assessment compared against.")
    comparison_completed_at: Optional[datetime] = Field(None, description="Completion timestamp of the target assessment.")
    comparison_assessment_version: Optional[str] = Field(None, description="Schema version of the comparison assessment.")

    comparison_type: ComparisonType = Field(..., description="Classification of comparison relationship.")
    elapsed_days: Optional[int] = Field(None, description="Days between completed assessments.")
    has_comparison: bool = Field(..., description="Whether a valid historical comparison exists.")
    schema_compatibility: SchemaCompatibility = Field("FULLY_COMPATIBLE", description="Assessment schema compatibility.")
    compatibility_notes: List[str] = Field(default_factory=list, description="Caveats regarding schema version or question shifts.")


# ---------------------------------------------------------------------------
# Factor Delta Item
# ---------------------------------------------------------------------------
class FactorDeltaItem(BaseModel):
    """Represents a specific contextual factor and its change over time."""
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Stable factor identifier.")
    title: str = Field(..., description="Human-readable title of the factor.")
    domain: ReportDomainKey = Field(..., description="Canonical health domain.")
    transition_type: FactorTransitionType = Field(..., description="Categorical transition state.")
    explanation: str = Field(..., description="Observational description of what changed or persisted.")
    previous_reported_value: Optional[str] = Field(None, description="Prior self-reported response value if available.")
    current_reported_value: Optional[str] = Field(None, description="Current self-reported response value if available.")
    evidence_refs: List[str] = Field(default_factory=list, description="Referenced clinical guidelines or literature IDs.")
    source_question_ids: List[str] = Field(default_factory=list, description="Source question IDs supporting this factor.")
    is_historical_condition: bool = Field(False, description="Whether this represents a past medical history event rather than an active symptom.")


# ---------------------------------------------------------------------------
# Domain Comparison Delta
# ---------------------------------------------------------------------------
class DomainComparisonDelta(BaseModel):
    """Domain-level comparison summary across the six canonical domains."""
    model_config = ConfigDict(extra="forbid")

    domain_key: ReportDomainKey = Field(..., description="Canonical domain key matching MantraAIReport.")
    domain_title: str = Field(..., description="Display title for the domain.")
    
    newly_reported_count: int = Field(0, description="Count of new focus areas reported in this assessment.")
    no_longer_reported_count: int = Field(0, description="Count of prior focus areas no longer reported.")
    persistent_count: int = Field(0, description="Count of focus areas reported in both assessments.")
    
    positive_adopted_count: int = Field(0, description="Count of new protective/positive habits reported.")
    positive_maintained_count: int = Field(0, description="Count of positive habits continued from prior assessment.")
    positive_lapsed_count: int = Field(0, description="Count of prior positive habits no longer reported.")

    factors: List[FactorDeltaItem] = Field(default_factory=list, description="Individual factor transition items in this domain.")
    unanswered_questions_previous: List[str] = Field(default_factory=list, description="Question IDs unanswered in the prior assessment.")
    unanswered_questions_current: List[str] = Field(default_factory=list, description="Question IDs unanswered in the current assessment.")
    domain_narrative: str = Field(..., description="Observational domain summary statement.")


# ---------------------------------------------------------------------------
# Overall Longitudinal Summary
# ---------------------------------------------------------------------------
class LongitudinalSummary(BaseModel):
    """High-level categorical transition counts across all domains."""
    model_config = ConfigDict(extra="forbid")

    newly_reported_focus_areas_count: int = Field(0, description="Total new focus areas across all domains.")
    no_longer_reported_focus_areas_count: int = Field(0, description="Total focus areas no longer reported.")
    persistent_focus_areas_count: int = Field(0, description="Total focus areas present in both assessments.")

    positive_habits_adopted_count: int = Field(0, description="Total positive habits newly reported.")
    positive_habits_maintained_count: int = Field(0, description="Total positive habits maintained.")
    positive_habits_lapsed_count: int = Field(0, description="Total positive habits no longer reported.")

    total_factors_current: int = Field(0, description="Total notable factors reported in current assessment.")
    total_factors_previous: int = Field(0, description="Total notable factors reported in target assessment.")

    unanswered_questions_current_count: int = Field(0, description="Total unanswered canonical questions in current assessment.")
    unanswered_questions_previous_count: int = Field(0, description="Total unanswered canonical questions in target assessment.")

    executive_narrative: str = Field(..., description="Calibrated observational summary paragraph.")


# ---------------------------------------------------------------------------
# Wellness Plan Adherence Context
# ---------------------------------------------------------------------------
class WellnessPlanAdherenceContext(BaseModel):
    """Contextual self-reported adherence data from the Wellness Planner."""
    model_config = ConfigDict(extra="forbid")

    has_linked_plan: bool = Field(False, description="Whether an active wellness plan existed between assessments.")
    plan_id: Optional[UUID] = Field(None, description="Linked WellnessPlan UUID.")
    plan_title: Optional[str] = Field(None, description="Title of the linked plan.")
    intervening_completed_actions_count: int = Field(0, description="Actions marked completed between assessments.")
    intervening_total_scheduled_actions_count: int = Field(0, description="Total actions scheduled between assessments.")
    adherence_rate_pct: Optional[float] = Field(None, description="Self-reported completion percentage (0.0 to 100.0).")
    adherence_narrative: str = Field(..., description="Observational description of routine engagement.")
    disclaimer: str = Field(
        default=(
            "Wellness plan adherence reflects self-reported routine engagement and lifestyle consistency. "
            "It does not establish clinical causality, medical cure, or physiological transformation."
        ),
        description="Mandatory non-causal disclaimer."
    )


# ---------------------------------------------------------------------------
# Master Comparison Response Schema
# ---------------------------------------------------------------------------
class AssessmentComparisonOut(BaseModel):
    """
    Complete structured response for longitudinal assessment comparison.
    Strictly non-diagnostic and observational.
    """
    model_config = ConfigDict(extra="forbid")

    comparison_metadata: ComparisonMetadata
    summary: LongitudinalSummary
    domains: List[DomainComparisonDelta]
    wellness_plan_context: Optional[WellnessPlanAdherenceContext] = None
    clinical_disclaimer: str = Field(
        default=(
            "MantraAI longitudinal comparisons reflect changes in self-reported health context, lifestyle habits, "
            "and environmental exposures over time. They are strictly non-diagnostic and do not establish medical cure, "
            "disease resolution, or fertility probability changes. Always discuss personal health observations with "
            "a qualified healthcare professional."
        ),
        description="Standard mandatory non-diagnostic disclaimer."
    )

    @model_validator(mode="before")
    @classmethod
    def scan_for_forbidden_fields(cls, values: Any) -> Any:
        """Strictly forbid unvalidated clinical scores or predictions."""
        if isinstance(values, dict):
            for key in values.keys():
                if key.lower() in FORBIDDEN_LONGITUDINAL_FIELDS:
                    raise ValueError(f"Forbidden clinical/diagnostic field detected in comparison schema: '{key}'")
        return values
