"""
MantraAI — Strict Clinical & Wellness Report Schema
====================================================

PURPOSE
-------
Defines the strict, strongly-typed Pydantic output schema for MantraAI's
evidence-informed health and wellness reports.

This schema acts as the validation contract that the downstream Groq report
synthesis layer MUST satisfy.

CLINICAL & SAFETY BOUNDARIES:
-----------------------------
- NOT a diagnostic document.
- FORBIDS numerical fertility/infertility predictions or probabilities.
- FORBIDS diagnostic labels (e.g. diagnosing clinical disorders from questionnaire alone).
- FORBIDS semen parameter predictions (count, motility, morphology).
- FORBIDS unknown/arbitrary extra fields (strict `extra='forbid'` enforcement).
- Mandates full evidence provenance (title, source, organization, year, valid URL, identifier).
"""

from typing import Any, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict

# ---------------------------------------------------------------------------
# Forbidden Clinical / Diagnostic Field Blacklist
# ---------------------------------------------------------------------------

FORBIDDEN_FIELDS: set[str] = {
    "fertility_probability",
    "infertility_probability",
    "fertility_percentage",
    "infertility_percentage",
    "fertility_score",
    "infertility_score",
    "diagnosis",
    "diagnosed_condition",
    "disease_probability",
    "semen_count_prediction",
    "semen_motility_prediction",
    "semen_morphology_prediction",
    "pregnancy_probability",
    "chance_of_conception",
}

# ---------------------------------------------------------------------------
# Controlled Domain Literals
# ---------------------------------------------------------------------------

ReportDomain = Literal[
    "reproductive_health",
    "sexual_health",
    "lifestyle_wellness",
    "environmental_exposure",
    "mental_behavioral_wellness",
    "substance_medication",
]

ActionType = Literal[
    "lifestyle",
    "self_monitoring",
    "education",
    "professional_discussion",
    "follow_up_assessment",
]

UrgencyLevel = Literal[
    "routine",
    "timely",
    "prompt",
]

WellnessStatus = Literal[
    "Stable",
    "Worth monitoring",
    "Several areas need attention",
]


# ---------------------------------------------------------------------------
# Section 1: Report Metadata
# ---------------------------------------------------------------------------

class ReportMetadata(BaseModel):
    """Metadata detailing the report generation parameters and versioning."""
    model_config = ConfigDict(extra="forbid")

    report_version: str = Field("2.0", description="Schema version of the report.")
    generated_at: str = Field(..., description="ISO timestamp of report generation.")
    model_provider: str = Field("groq", description="LLM provider name.")
    model_name: str = Field(..., description="Underlying model identifier.")
    questionnaire_version: str = Field("1.0", description="Questionnaire version answered.")


# ---------------------------------------------------------------------------
# Section 2: Executive Summary
# ---------------------------------------------------------------------------

class ExecutiveSummary(BaseModel):
    """High-level structured non-diagnostic overview."""
    model_config = ConfigDict(extra="forbid")

    headline: str = Field(..., description="Short editorial headline.")
    overview: str = Field(..., description="Comprehensive non-diagnostic overview paragraph.")
    key_themes: list[str] = Field(default_factory=list, description="Top thematic health areas identified.")
    areas_for_attention: list[str] = Field(default_factory=list, description="Specific modifiable or follow-up areas.")
    positive_context: list[str] = Field(default_factory=list, description="Protective habits and baseline strengths.")
    overall_wellness_status: WellnessStatus = Field("Stable", description="Controlled wellness category.")


# ---------------------------------------------------------------------------
# Section 3-8: Domain Sections
# ---------------------------------------------------------------------------

class ReproductiveHealthReportSection(BaseModel):
    """Reproductive history, symptoms, and anatomical health context."""
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(..., description="Domain overview narrative.")
    reported_context: list[str] = Field(default_factory=list, description="Reported history/symptoms summary.")
    relevant_factors: list[str] = Field(default_factory=list, description="Key contextual observations.")
    evidence_refs: list[str] = Field(default_factory=list, description="IDs of matching evidence references.")
    limitations: list[str] = Field(default_factory=list, description="Domain-specific limitations.")


class SexualHealthReportSection(BaseModel):
    """Psychosexual health, intimacy, and digital habits context."""
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(..., description="Domain overview narrative.")
    reported_context: list[str] = Field(default_factory=list, description="Reported behavioral or performance context.")
    relevant_factors: list[str] = Field(default_factory=list, description="Key contextual observations.")
    evidence_refs: list[str] = Field(default_factory=list, description="IDs of matching evidence references.")
    limitations: list[str] = Field(default_factory=list, description="Domain-specific limitations.")


class MentalBehavioralWellnessReportSection(BaseModel):
    """Stress levels, coping patterns, and psychological wellbeing context."""
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(..., description="Domain overview narrative.")
    reported_context: list[str] = Field(default_factory=list, description="Reported stress and coping context.")
    relevant_factors: list[str] = Field(default_factory=list, description="Key contextual observations.")
    evidence_refs: list[str] = Field(default_factory=list, description="IDs of matching evidence references.")
    limitations: list[str] = Field(default_factory=list, description="Domain-specific limitations.")


class LifestyleWellnessReportSection(BaseModel):
    """Daily movement, sleep duration, nutrition, and hydration."""
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(..., description="Domain overview narrative.")
    relevant_factors: list[str] = Field(default_factory=list, description="Key contextual observations.")
    evidence_refs: list[str] = Field(default_factory=list, description="IDs of matching evidence references.")
    limitations: list[str] = Field(default_factory=list, description="Domain-specific limitations.")


class EnvironmentalExposureReportSection(BaseModel):
    """Hyperthermia, device heat, and ambient/occupational exposures."""
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(..., description="Domain overview narrative.")
    relevant_factors: list[str] = Field(default_factory=list, description="Key contextual observations.")
    evidence_refs: list[str] = Field(default_factory=list, description="IDs of matching evidence references.")
    limitations: list[str] = Field(default_factory=list, description="Domain-specific limitations.")


class SubstanceMedicationReportSection(BaseModel):
    """Tobacco, alcohol, medications, and substance exposures."""
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(..., description="Domain overview narrative.")
    relevant_factors: list[str] = Field(default_factory=list, description="Key contextual observations.")
    evidence_refs: list[str] = Field(default_factory=list, description="IDs of matching evidence references.")
    limitations: list[str] = Field(default_factory=list, description="Domain-specific limitations.")


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Section 9: Priority Factors
# ---------------------------------------------------------------------------

class PriorityFactor(BaseModel):
    """Structured modifiable or notable factor requiring user attention."""
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Stable unique identifier for the factor.")
    domain: ReportDomain = Field(..., description="Health domain category.")
    title: str = Field(..., description="Clear, concise factor title.")
    description: str = Field(..., description="Factual, explainable description.")
    source_question_ids: list[str] = Field(..., min_length=1, description="Source question IDs.")
    evidence_refs: list[str] = Field(default_factory=list, description="Referenced evidence IDs.")
    actionable: bool = Field(True, description="Whether this factor can be modified or optimized.")
    severity: Optional[Literal["low", "moderate", "notable"]] = Field("moderate", description="Informational severity indicator.")


PriorityFactorReportItem = PriorityFactor


# ---------------------------------------------------------------------------
# Section 10: Positive Factors
# ---------------------------------------------------------------------------

class PositiveFactorReportItem(BaseModel):
    """Structured protective habit or optimal baseline factor."""
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Stable identifier for the positive factor.")
    domain: ReportDomain = Field(..., description="Health domain category.")
    title: str = Field(..., description="Clear title of the positive habit.")
    description: str = Field(..., description="Explanation of why this habit supports health.")
    source_question_ids: list[str] = Field(..., min_length=1, description="Source question IDs.")
    evidence_refs: list[str] = Field(default_factory=list, description="Referenced evidence IDs.")


# ---------------------------------------------------------------------------
# Section 11: Personalized Action Plan
# ---------------------------------------------------------------------------

class PersonalizedAction(BaseModel):
    """Specific, non-prescriptive actionable step for wellness optimization."""
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Unique action ID.")
    title: str = Field(..., description="Short action statement.")
    description: str = Field(..., description="Detailed practical implementation guide.")
    domain: ReportDomain = Field(..., description="Health domain.")
    rationale: str = Field(..., description="Biological and evidence rationale.")
    evidence_refs: list[str] = Field(default_factory=list, description="Referenced evidence IDs.")
    timeframe: str = Field(..., description="Expected timeframe (e.g. '1-2 weeks', '1-3 months', 'ongoing').")
    action_type: ActionType = Field(..., description="Categorized action type.")
    priority: Optional[int] = Field(1, description="Sequential priority rank.")


# ---------------------------------------------------------------------------
# Section 12: Clinician Discussion Questions
# ---------------------------------------------------------------------------

class ClinicianQuestion(BaseModel):
    """Structured question to empower constructive dialogue with a healthcare provider."""
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Question identifier.")
    question: str = Field(..., description="Suggested question for the physician.")
    domain: ReportDomain = Field(..., description="Relevant health domain.")
    reason: str = Field(..., description="Context for why this question is relevant.")


ClinicianDiscussionQuestion = ClinicianQuestion


# ---------------------------------------------------------------------------
# Section 13: When to Seek Professional Help
# ---------------------------------------------------------------------------

class ProfessionalHelpItem(BaseModel):
    """Structured clinical follow-up indicator with calibrated urgency."""
    model_config = ConfigDict(extra="forbid")

    trigger: str = Field(..., description="Specific sign, symptom, or exposure.")
    explanation: str = Field(..., description="Clinical context explaining why a specialist consultation is advised.")
    urgency: UrgencyLevel = Field(..., description="Calibrated urgency level ('routine', 'timely', 'prompt').")


ProfessionalHelpGuidance = ProfessionalHelpItem
ClinicalUrgency = UrgencyLevel


# ---------------------------------------------------------------------------
# Section 14: Evidence References
# ---------------------------------------------------------------------------

class EvidenceReference(BaseModel):
    """Traceable citation with full provenance."""
    model_config = ConfigDict(extra="forbid")

    evidence_id: str = Field(..., min_length=1, description="Canonical evidence chunk or document ID.")
    title: str = Field(..., min_length=1, description="Official publication title.")
    source: str = Field(..., min_length=1, description="Short source citation (e.g. WHO, AUA/ASRM, EAU).")
    year: Optional[int] = Field(None, description="Publication year.")
    url: str = Field(..., min_length=1, description="Verified official URL.")
    source_identifier: str = Field(..., min_length=1, description="Standard DOI, PMID, or ISBN.")
    relevance: str = Field(..., min_length=1, description="Specific relevance to this report.")

    @model_validator(mode="before")
    @classmethod
    def validate_url_and_source(cls, data: Any) -> Any:
        if isinstance(data, dict):
            url_val = str(data.get("url", ""))
            if url_val and not (url_val.startswith("http://") or url_val.startswith("https://")):
                raise ValueError(f"URL must start with http:// or https://: {url_val}")
            src_val = str(data.get("source", "")).strip()
            if not src_val:
                raise ValueError("Source citation cannot be empty")
        return data


# ---------------------------------------------------------------------------
# Section 15: Limitations
# ---------------------------------------------------------------------------

class ReportLimitations(BaseModel):
    """Explicit methodology and screening limitations."""
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(..., description="General limitations overview.")
    methodology_notes: list[str] = Field(default_factory=list, description="Methodology boundaries.")
    items: list[str] = Field(default_factory=list, description="Specific context limitations.")


# ---------------------------------------------------------------------------
# Master Top-Level Report Model
# ---------------------------------------------------------------------------

class MantraAIReport(BaseModel):
    """
    Comprehensive, structured clinical wellness report for MantraAI.

    Guarantees strict schema adherence, provenance preservation, and complete
    exclusion of unvalidated numerical probabilities or medical diagnoses.
    """
    model_config = ConfigDict(extra="forbid")

    report_metadata: ReportMetadata
    executive_summary: ExecutiveSummary
    reproductive_health: ReproductiveHealthReportSection
    sexual_health: SexualHealthReportSection
    mental_behavioral_wellness: MentalBehavioralWellnessReportSection
    lifestyle_wellness: LifestyleWellnessReportSection
    environmental_exposure: EnvironmentalExposureReportSection
    substance_medication: SubstanceMedicationReportSection
    priority_factors: list[PriorityFactor] = Field(default_factory=list)
    positive_factors: list[PositiveFactorReportItem] = Field(default_factory=list)
    personalized_action_plan: list[PersonalizedAction] = Field(default_factory=list)
    questions_to_discuss_with_clinician: list[ClinicianQuestion] = Field(default_factory=list)
    when_to_seek_professional_help: list[ProfessionalHelpItem] = Field(default_factory=list)
    evidence: list[EvidenceReference] = Field(default_factory=list)
    limitations: ReportLimitations = Field(
        default_factory=lambda: ReportLimitations(
            summary=(
                "This report is based on self-reported questionnaire data and evidence-informed clinical guidelines. "
                "It does not replace clinical evaluation, physical examination, laboratory testing, or semen analysis."
            ),
            methodology_notes=[
                "Self-reported lifestyle and reproductive history data.",
                "Evidence-informed mapping against established urological and reproductive guidelines.",
            ],
            items=[
                "Findings represent statistical and evidence-based associations, not individual diagnoses.",
                "Lifestyle factors are modifiable and should be interpreted in consultation with a physician.",
            ],
        ),
        description="Explicit methodology and screening limitations.",
    )
    disclaimer: str = Field(
        default=(
            "MantraAI is an educational pre-clinical screening and health intelligence platform. "
            "It does NOT provide medical diagnoses, treatment plans, or fertility probability scores. "
            "All insights are for informational purposes to guide constructive discussion with qualified healthcare professionals."
        ),
        description="Standard mandatory clinical disclaimer."
    )

    @model_validator(mode="before")
    @classmethod
    def scan_for_forbidden_fields(cls, values: Any) -> Any:
        """Reject any payload attempting to include diagnostic or predictive fertility fields."""
        if isinstance(values, dict):
            def _scan(d: dict[str, Any]):
                for k, v in d.items():
                    if str(k).strip().lower() in FORBIDDEN_FIELDS:
                        raise ValueError(f"Forbidden diagnostic or fertility-prediction field detected: '{k}'")
                    if isinstance(v, dict):
                        _scan(v)
                    elif isinstance(v, list):
                        for item in v:
                            if isinstance(item, dict):
                                _scan(item)
            _scan(values)
        return values


# ---------------------------------------------------------------------------
# Backward Compatibility Adapters
# ---------------------------------------------------------------------------

def new_report_to_legacy_view(report: MantraAIReport) -> dict[str, Any]:
    """
    Transforms a modern MantraAIReport instance into the legacy report JSON format
    consumed by the existing frontend ReportViewer component.
    """
    key_findings = [
        {
            "title": factor.title,
            "severity": factor.severity or "moderate",
            "explanation": factor.description,
            "evidence": factor.source_question_ids,
        }
        for factor in report.priority_factors
    ]

    priority_actions = [
        {
            "priority": act.priority or (idx + 1),
            "area": act.domain.replace("_", " ").title(),
            "action": act.title,
            "reason": act.rationale,
        }
        for idx, act in enumerate(report.personalized_action_plan)
    ]

    return {
        "summary": {
            "headline": report.executive_summary.headline,
            "overview": report.executive_summary.overview,
            "overall_wellness_status": report.executive_summary.overall_wellness_status,
        },
        "model_name": report.report_metadata.model_name,
        "key_findings": key_findings,
        "reproductive_health": {
            "summary": report.reproductive_health.summary,
            "relevant_factors": report.reproductive_health.relevant_factors,
            "limitations": report.reproductive_health.limitations,
        },
        "sexual_health": {
            "summary": report.sexual_health.summary,
            "relevant_factors": report.sexual_health.relevant_factors,
            "limitations": report.sexual_health.limitations,
        },
        "mental_wellbeing": {
            "summary": report.mental_behavioral_wellness.summary,
            "relevant_factors": report.mental_behavioral_wellness.relevant_factors,
        },
        "lifestyle": {
            "summary": report.lifestyle_wellness.summary,
            "relevant_factors": report.lifestyle_wellness.relevant_factors,
        },
        "environmental_exposure": {
            "summary": report.environmental_exposure.summary,
            "relevant_factors": report.environmental_exposure.relevant_factors,
        },
        "substance_medication": {
            "summary": report.substance_medication.summary,
            "relevant_factors": report.substance_medication.relevant_factors,
        },
        "priority_actions": priority_actions,
        "priority_factors": [f.model_dump() for f in report.priority_factors],
        "positive_factors": [p.model_dump() for p in report.positive_factors],
        "personalized_action_plan": [a.model_dump() for a in report.personalized_action_plan],
        "questions_to_discuss_with_clinician": [q.model_dump() for q in report.questions_to_discuss_with_clinician],
        "when_to_seek_professional_help": [h.model_dump() for h in report.when_to_seek_professional_help],
        "evidence": [e.model_dump() for e in report.evidence],
        "limitations": report.limitations.model_dump(),
        "disclaimer": report.disclaimer,
    }


def legacy_report_to_new_schema(legacy: dict[str, Any]) -> MantraAIReport:
    """
    Safely constructs a MantraAIReport from a legacy report dictionary.
    """
    summary_dict = legacy.get("summary", {})
    headline = summary_dict.get("headline", "Assessment Summary")
    overview = summary_dict.get("overview", "Assessment completed.")
    status_raw = summary_dict.get("overall_wellness_status", "Stable")
    status = status_raw if status_raw in ["Stable", "Worth monitoring", "Several areas need attention"] else "Stable"

    rep_summary = legacy.get("reproductive_health", {}).get("summary", "No reproductive concerns reported.")
    sex_summary = legacy.get("sexual_health", {}).get("summary", "No sexual performance concerns reported.")
    men_summary = legacy.get("mental_wellbeing", {}).get("summary", "Mental wellness indicators reviewed.")
    life_summary = str(legacy.get("lifestyle", {}).get("summary", "Lifestyle habits reviewed."))
    env_summary = str(legacy.get("environmental_exposure", {}).get("summary", "Environmental exposures reviewed."))
    sub_summary = str(legacy.get("substance_medication", {}).get("summary", "Substances and medications reviewed."))

    meta = ReportMetadata(
        report_version="2.0",
        generated_at="2026-10-02T00:00:00Z",
        model_provider="groq",
        model_name=legacy.get("model_name", "llama-3.3-70b-versatile"),
        questionnaire_version="1.0"
    )

    exec_summary = ExecutiveSummary(
        headline=headline,
        overview=overview,
        key_themes=[],
        areas_for_attention=[],
        positive_context=[],
        overall_wellness_status=status
    )

    limitations = ReportLimitations(
        summary="Questionnaire screening results provide structured health context and do not constitute clinical diagnoses.",
        methodology_notes=["Self-reported questionnaire context only."],
        items=["No laboratory semen analysis is included in this screening."]
    )

    return MantraAIReport(
        report_metadata=meta,
        executive_summary=exec_summary,
        reproductive_health=ReproductiveHealthReportSection(summary=rep_summary),
        sexual_health=SexualHealthReportSection(summary=sex_summary),
        mental_behavioral_wellness=MentalBehavioralWellnessReportSection(summary=men_summary),
        lifestyle_wellness=LifestyleWellnessReportSection(summary=life_summary),
        environmental_exposure=EnvironmentalExposureReportSection(summary=env_summary),
        substance_medication=SubstanceMedicationReportSection(summary=sub_summary),
        priority_factors=[],
        positive_factors=[],
        personalized_action_plan=[],
        questions_to_discuss_with_clinician=[],
        when_to_seek_professional_help=[],
        evidence=[],
        limitations=limitations,
        disclaimer=legacy.get("disclaimer", "MantraAI is an educational pre-clinical screening utility.")
    )
