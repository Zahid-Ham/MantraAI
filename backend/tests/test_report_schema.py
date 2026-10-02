"""
Tests for app/schemas/report.py
================================

PURPOSE
-------
Verifies strict Pydantic validation, boundary enforcement, forbidden field
rejection, domain/action/urgency literal constraints, and backward compatibility
adapters in the MantraAIReport schema.

All tests use synthetic test fixtures.
No real user or patient data is used.

COVERAGE:
  1.  Minimal valid report validation
  2.  Complete valid report validation
  3.  Missing required section rejected
  4.  Invalid domain rejected
  5.  Invalid action type rejected
  6.  Invalid urgency rejected
  7.  Evidence reference without valid URL rejected
  8.  Evidence reference without source rejected
  9.  Priority factor without source_question_ids rejected
  10. Unknown / arbitrary fields rejected (strict extra='forbid')
  11. Fertility probability field rejected
  12. Infertility probability field rejected
  13. Diagnosis field rejected
  14. Semen prediction fields rejected
  15. Valid non-diagnostic reproductive report accepted
  16. Valid sexual-health report accepted
  17. Valid mental-wellness report accepted
  18. Valid evidence references accepted
  19. JSON serialization and deserialization round-trip
  20. Backward compatibility adapters (new_report_to_legacy_view & legacy_report_to_new_schema)
"""

import sys
import os
import json
import pytest
from pydantic import ValidationError

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
    PriorityFactor,
    PositiveFactorReportItem,
    PersonalizedAction,
    ClinicianQuestion,
    ProfessionalHelpItem,
    EvidenceReference,
    ReportLimitations,
    new_report_to_legacy_view,
    legacy_report_to_new_schema,
)


def _get_valid_minimal_payload() -> dict:
    """Helper returning a clean, valid minimal dictionary for MantraAIReport."""
    return {
        "report_metadata": {
            "report_version": "2.0",
            "generated_at": "2026-10-02T12:00:00Z",
            "model_provider": "groq",
            "model_name": "llama-3.3-70b-versatile",
            "questionnaire_version": "1.0",
        },
        "executive_summary": {
            "headline": "Personalized Health and Wellness Context",
            "overview": "Your assessment responses indicate a stable baseline with several opportunities for lifestyle optimization.",
            "key_themes": ["Sleep Recovery", "Physical Activity"],
            "areas_for_attention": ["Sleep Duration"],
            "positive_context": ["Non-smoker"],
            "overall_wellness_status": "Stable",
        },
        "reproductive_health": {
            "summary": "No active reproductive physical symptoms or prior conditions reported.",
            "reported_context": [],
            "relevant_factors": [],
            "evidence_refs": [],
            "limitations": ["Questionnaire screening context only."],
        },
        "sexual_health": {
            "summary": "Psychosexual parameters indicate healthy baseline function.",
            "reported_context": [],
            "relevant_factors": [],
            "evidence_refs": [],
            "limitations": [],
        },
        "mental_behavioral_wellness": {
            "summary": "Stress and psychological screening indicators reflect manageable baseline levels.",
            "reported_context": [],
            "relevant_factors": [],
            "evidence_refs": [],
            "limitations": [],
        },
        "lifestyle_wellness": {
            "summary": "Daily movement and dietary factors reviewed.",
            "relevant_factors": ["Adequate daily hydration"],
            "evidence_refs": [],
            "limitations": [],
        },
        "environmental_exposure": {
            "summary": "No significant occupational heat or chemical exposures reported.",
            "relevant_factors": [],
            "evidence_refs": [],
            "limitations": [],
        },
        "substance_medication": {
            "summary": "No tobacco, steroid, or chronic prescription medication exposures reported.",
            "relevant_factors": [],
            "evidence_refs": [],
            "limitations": [],
        },
        "priority_factors": [],
        "positive_factors": [],
        "personalized_action_plan": [],
        "questions_to_discuss_with_clinician": [],
        "when_to_seek_professional_help": [],
        "evidence": [],
        "limitations": {
            "summary": "This report provides evidence-informed health context and does not constitute a clinical diagnosis.",
            "methodology_notes": ["Self-reported questionnaire data only."],
            "items": ["No laboratory semen analysis is included."],
        },
        "disclaimer": "MantraAI is an educational pre-clinical utility. It does not replace medical diagnostics.",
    }


# ===========================================================================
# 1. Minimal valid report
# ===========================================================================
def test_minimal_valid_report():
    """Minimal valid report instantiates and validates successfully."""
    payload = _get_valid_minimal_payload()
    report = MantraAIReport(**payload)
    assert report.report_metadata.report_version == "2.0"
    assert report.executive_summary.overall_wellness_status == "Stable"
    assert len(report.priority_factors) == 0


# ===========================================================================
# 2. Complete valid report
# ===========================================================================
def test_complete_valid_report():
    """Complete report with all factor items, actions, questions, and evidence validates cleanly."""
    payload = _get_valid_minimal_payload()
    
    payload["priority_factors"] = [
        {
            "id": "pf_sleep_01",
            "domain": "lifestyle_wellness",
            "title": "Suboptimal Sleep Duration",
            "description": "Reported 5-6 hours of nightly sleep, below biological recovery benchmarks.",
            "source_question_ids": ["sleep_duration"],
            "evidence_refs": ["env-sleep-recovery"],
            "actionable": True,
            "severity": "moderate",
        }
    ]
    payload["positive_factors"] = [
        {
            "id": "pos_smoke_01",
            "domain": "substance_medication",
            "title": "Tobacco Abstinence",
            "description": "No smoking exposure reported, supporting vascular and cellular health.",
            "source_question_ids": ["smoking_status"],
            "evidence_refs": ["eau-tobacco-alcohol"],
        }
    ]
    payload["personalized_action_plan"] = [
        {
            "id": "act_sleep_01",
            "title": "Optimize Sleep Schedule",
            "description": "Gradually extend nightly sleep window to 7-8 hours by maintaining consistent sleep times.",
            "domain": "lifestyle_wellness",
            "rationale": "Deep sleep cycles support nocturnal testosterone synthesis and tissue repair.",
            "evidence_refs": ["env-sleep-recovery"],
            "timeframe": "2-4 weeks",
            "action_type": "lifestyle",
            "priority": 1,
        }
    ]
    payload["questions_to_discuss_with_clinician"] = [
        {
            "id": "cq_varicocele_01",
            "question": "Would a physical scrotal evaluation or ultrasound be appropriate to assess my reported varicocele history?",
            "domain": "reproductive_health",
            "reason": "History of varicocele noted on screening.",
        }
    ]
    payload["when_to_seek_professional_help"] = [
        {
            "trigger": "Persistent testicular discomfort or pain",
            "explanation": "Physical symptoms require clinical physical examination and ultrasound imaging.",
            "urgency": "timely",
        }
    ]
    payload["evidence"] = [
        {
            "evidence_id": "who-infertility-eval",
            "title": "Guideline for the prevention, diagnosis and treatment of infertility",
            "source": "WHO",
            "year": 2024,
            "url": "https://www.who.int/publications/i/item/9789240115774",
            "source_identifier": "ISBN: 9789240115774",
            "relevance": "Standard protocol for initial evaluation.",
        }
    ]

    report = MantraAIReport(**payload)
    assert len(report.priority_factors) == 1
    assert len(report.positive_factors) == 1
    assert len(report.personalized_action_plan) == 1
    assert len(report.questions_to_discuss_with_clinician) == 1
    assert len(report.when_to_seek_professional_help) == 1
    assert len(report.evidence) == 1


# ===========================================================================
# 3. Missing required section
# ===========================================================================
def test_missing_required_section_raises():
    """Omitting a required section (e.g. executive_summary) raises a ValidationError."""
    payload = _get_valid_minimal_payload()
    del payload["executive_summary"]
    with pytest.raises(ValidationError):
        MantraAIReport(**payload)


# ===========================================================================
# 4. Invalid domain
# ===========================================================================
def test_invalid_domain_rejected():
    """Passing an unapproved domain string raises a ValidationError."""
    payload = _get_valid_minimal_payload()
    payload["priority_factors"] = [
        {
            "id": "pf_invalid",
            "domain": "invalid_nonexistent_domain",
            "title": "Invalid Title",
            "description": "Invalid description.",
            "source_question_ids": ["q1"],
            "evidence_refs": [],
            "actionable": True,
        }
    ]
    with pytest.raises(ValidationError):
        MantraAIReport(**payload)


# ===========================================================================
# 5. Invalid action type
# ===========================================================================
def test_invalid_action_type_rejected():
    """Action types not in the controlled list (e.g. medical_prescription) are rejected."""
    payload = _get_valid_minimal_payload()
    payload["personalized_action_plan"] = [
        {
            "id": "act_01",
            "title": "Prescribe Drug",
            "description": "Take medication XYZ.",
            "domain": "lifestyle_wellness",
            "rationale": "Rationale",
            "evidence_refs": [],
            "timeframe": "1 week",
            "action_type": "prescribe_medication",  # FORBIDDEN / INVALID
            "priority": 1,
        }
    ]
    with pytest.raises(ValidationError):
        MantraAIReport(**payload)


# ===========================================================================
# 6. Invalid urgency
# ===========================================================================
def test_invalid_urgency_rejected():
    """Urgency levels not in ['routine', 'timely', 'prompt'] are rejected."""
    payload = _get_valid_minimal_payload()
    payload["when_to_seek_professional_help"] = [
        {
            "trigger": "Mild symptom",
            "explanation": "Explanation",
            "urgency": "immediate_emergency_911",  # INVALID
        }
    ]
    with pytest.raises(ValidationError):
        MantraAIReport(**payload)


# ===========================================================================
# 7. Evidence reference without valid URL
# ===========================================================================
def test_evidence_reference_without_valid_url_rejected():
    """Evidence references with missing or non-http URLs fail validation."""
    with pytest.raises(ValidationError):
        EvidenceReference(
            evidence_id="ev_01",
            title="Some Guideline",
            source="WHO",
            year=2024,
            url="not_a_valid_url",
            source_identifier="ISBN: 123",
            relevance="Relevance note",
        )


# ===========================================================================
# 8. Evidence reference without source
# ===========================================================================
def test_evidence_reference_without_source_rejected():
    """Evidence references missing the source or organization fail validation."""
    with pytest.raises(ValidationError):
        EvidenceReference(
            evidence_id="ev_01",
            title="Some Guideline",
            source="",  # Empty source
            year=2024,
            url="https://who.int",
            source_identifier="ISBN: 123",
            relevance="Relevance note",
        )


# ===========================================================================
# 9. Priority factor without source_question_ids
# ===========================================================================
def test_priority_factor_empty_source_question_ids_rejected():
    """Priority factors must trace to at least one valid source question ID."""
    with pytest.raises(ValidationError):
        PriorityFactor(
            id="pf_01",
            domain="lifestyle_wellness",
            title="Title",
            description="Description",
            source_question_ids=[],  # Empty list rejected
            evidence_refs=[],
            actionable=True,
        )


# ===========================================================================
# 10. Unknown/arbitrary fields rejected (extra='forbid')
# ===========================================================================
def test_unknown_arbitrary_fields_rejected():
    """Injecting unknown fields anywhere in the schema is strictly forbidden."""
    payload = _get_valid_minimal_payload()
    payload["unknown_hallucinated_section"] = {"some_data": 123}
    with pytest.raises(ValidationError):
        MantraAIReport(**payload)


# ===========================================================================
# 11. Fertility probability rejected
# ===========================================================================
def test_fertility_probability_rejected():
    """Payloads attempting to inject fertility_probability are rejected."""
    payload = _get_valid_minimal_payload()
    payload["executive_summary"]["fertility_probability"] = 0.85
    with pytest.raises(ValidationError):
        MantraAIReport(**payload)


# ===========================================================================
# 12. Infertility probability rejected
# ===========================================================================
def test_infertility_probability_rejected():
    """Payloads attempting to inject infertility_probability are rejected."""
    payload = _get_valid_minimal_payload()
    payload["infertility_probability"] = "High"
    with pytest.raises(ValidationError):
        MantraAIReport(**payload)


# ===========================================================================
# 13. Diagnosis field rejected
# ===========================================================================
def test_diagnosis_field_rejected():
    """Payloads attempting to label clinical diagnoses are rejected."""
    payload = _get_valid_minimal_payload()
    payload["reproductive_health"]["diagnosis"] = "Varicocele Grade 3"
    with pytest.raises(ValidationError):
        MantraAIReport(**payload)


# ===========================================================================
# 14. Semen prediction fields rejected
# ===========================================================================
def test_semen_prediction_fields_rejected():
    """Payloads attempting to output fake semen analysis numbers are rejected."""
    payload = _get_valid_minimal_payload()
    payload["semen_count_prediction"] = "15 million/ml"
    with pytest.raises(ValidationError):
        MantraAIReport(**payload)


# ===========================================================================
# 15. Valid non-diagnostic reproductive report accepted
# ===========================================================================
def test_valid_reproductive_report():
    """Properly structured reproductive narrative without diagnostic claims validates."""
    sec = ReproductiveHealthReportSection(
        summary="Reproductive history screening noted prior childhood mumps and reported varicocele history.",
        reported_context=["Childhood mumps reported", "Known varicocele reported"],
        relevant_factors=["History warrants clinical urological consultation"],
        evidence_refs=["aua-asrm-varicocele", "aua-asrm-history-symptoms"],
        limitations=["Questionnaire screening does not replace physical palpation or ultrasound."]
    )
    assert sec.summary.startswith("Reproductive history")
    assert len(sec.evidence_refs) == 2


# ===========================================================================
# 16. Valid sexual-health report accepted
# ===========================================================================
def test_valid_sexual_health_report():
    """Properly structured psychosexual narrative validates."""
    sec = SexualHealthReportSection(
        summary="Reported occasional anticipatory performance anxiety and spectatoring self-monitoring during intimacy.",
        reported_context=["Anticipatory anxiety noted", "Spectatoring noted"],
        relevant_factors=["Mindfulness and cognitive reframing support autonomic relaxation"],
        evidence_refs=["psychosexual-spectatoring-anxiety"],
        limitations=["Performance anxiety is a common psychosexual state, not an organic pathology."]
    )
    assert "spectatoring" in sec.summary.lower()
    assert len(sec.reported_context) == 2


# ===========================================================================
# 17. Valid mental-wellness report accepted
# ===========================================================================
def test_valid_mental_wellness_report():
    """Properly structured mental wellness narrative validates."""
    sec = MentalBehavioralWellnessReportSection(
        summary="Perceived stress screening indicator reflects moderate workload strain.",
        reported_context=["Extended work hours reported (>10 hrs/day)"],
        relevant_factors=["Recovery intervals support cortisol normalization"],
        evidence_refs=[],
        limitations=["PSS-10 screening indicator is a proxy, not a psychiatric evaluation."]
    )
    assert sec.summary != ""


# ===========================================================================
# 18. Valid evidence references accepted
# ===========================================================================
def test_valid_evidence_reference():
    """EvidenceReference with valid WHO URL and DOI identifier passes."""
    ref = EvidenceReference(
        evidence_id="eau-hyperthermia-heat",
        title="EAU Guidelines on Sexual and Reproductive Health",
        source="European Association of Urology (EAU)",
        year=2024,
        url="https://uroweb.org/guidelines/sexual-and-reproductive-health",
        source_identifier="EAU Guidelines 2024",
        relevance="Explains testicular thermoregulation and local hyperthermia.",
    )
    assert ref.year == 2024
    assert ref.url.startswith("https://")


# ===========================================================================
# 19. JSON serialization and deserialization
# ===========================================================================
def test_json_serialization_roundtrip():
    """MantraAIReport serializes to JSON and deserializes back into identical model."""
    payload = _get_valid_minimal_payload()
    report1 = MantraAIReport(**payload)
    
    json_str = report1.model_dump_json()
    assert isinstance(json_str, str)
    
    data_dict = json.loads(json_str)
    report2 = MantraAIReport.model_validate(data_dict)
    
    assert report1 == report2


# ===========================================================================
# 20. Backward compatibility adapters
# ===========================================================================
def test_backward_compatibility_adapters():
    """Verifies that new_report_to_legacy_view and legacy_report_to_new_schema work symmetrically."""
    payload = _get_valid_minimal_payload()
    payload["priority_factors"] = [
        {
            "id": "pf_1",
            "domain": "lifestyle_wellness",
            "title": "Sleep Duration",
            "description": "5 hours sleep",
            "source_question_ids": ["sleep_duration"],
            "evidence_refs": [],
            "actionable": True,
            "severity": "moderate",
        }
    ]
    report = MantraAIReport(**payload)

    # Convert to legacy dictionary
    legacy_view = new_report_to_legacy_view(report)
    assert "summary" in legacy_view
    assert "headline" in legacy_view["summary"]
    assert "overview" in legacy_view["summary"]
    assert "key_findings" in legacy_view
    assert len(legacy_view["key_findings"]) == 1
    assert legacy_view["key_findings"][0]["title"] == "Sleep Duration"
    assert "disclaimer" in legacy_view

    # Convert back to new schema
    reconstructed = legacy_report_to_new_schema(legacy_view)
    assert isinstance(reconstructed, MantraAIReport)
    assert reconstructed.executive_summary.headline == "Personalized Health and Wellness Context"
