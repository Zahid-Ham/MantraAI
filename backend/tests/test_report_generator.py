"""
MantraAI — Groq Structured Report Generator Tests
=================================================

PURPOSE
-------
Unit, integration, safety, and boundary tests for the Groq Structured Report Generator
(`app.services.report_generator`).

All external Groq API calls are mocked using standard unittest/pytest mocking.
No real network calls or API credits are consumed.

TEST COVERAGE (20+ tests):
--------------------------
1. Valid structured Groq response
2. Pydantic validation success
3. Invalid JSON handling
4. Missing required report section
5. Forbidden diagnosis field rejection
6. Forbidden fertility probability rejection
7. Unknown evidence ID rejection
8. Unknown question ID rejection
9. Valid evidence references accepted
10. Valid question IDs accepted
11. Retry after validation failure
12. Stop after maximum retries
13. Authentication error does not blindly retry
14. Timeout handling
15. Rate-limit handling
16. Successful persistence
17. Invalid report is never persisted as final
18. Backward-compatible API response
19. Existing ReportViewer contract still works
20. No sensitive payload appears in logs
21. End-to-end pipeline test with mocked Groq
"""

import json
import logging
import urllib.error
from unittest.mock import patch, MagicMock
from uuid import uuid4
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

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
    new_report_to_legacy_view,
)
from app.services.normalizer import (
    normalize_assessment_responses,
    NormalizedAssessment,
    QUESTION_DOMAIN_MAP,
)
from app.services.context_engine import build_health_context, HealthContext
from app.services.evidence_retriever import (
    retrieve_evidence_for_health_context,
    EvidenceContext,
    EvidenceItem,
)
from app.services.report_generator import (
    generate_mantra_report,
    validate_report_content,
    build_fallback_report,
    build_system_prompt,
    build_user_prompt,
    execute_groq_request,
    ReportAuthError,
    ReportRateLimitError,
    ReportConnectionError,
    MalformedReportJSONError,
    ReportValidationError,
    InvalidEvidenceReferenceError,
    InvalidQuestionIdError,
)


# ===========================================================================
# Synthetic Fixtures & Helper Generators
# ===========================================================================

@pytest.fixture
def synthetic_answers():
    return {
        "age_years": 32,
        "bmi_category": "25-29.9",
        "smoking_status": "regular",
        "physical_activity_level": "sedentary",
        "hours_sitting_per_day": "8-10_hours",
        "laptop_on_lap": "daily_2plus_hours",
        "hot_bath_frequency": "multiple_weekly",
        "perceived_stress_pss10": 22,
        "sleep_duration": "less_than_6",
        "anticipatory_anxiety_before_sex": "occasional",
        "partnered_sexual_difficulty": "occasional",
        "supplement_use": ["zinc", "ashwagandha"],
    }


@pytest.fixture
def sample_normalized(synthetic_answers):
    return normalize_assessment_responses(synthetic_answers)


@pytest.fixture
def sample_health_context(sample_normalized):
    return build_health_context(sample_normalized)


@pytest.fixture
def sample_evidence_context(sample_health_context):
    return retrieve_evidence_for_health_context(sample_health_context)


@pytest.fixture
def valid_report_dict(sample_evidence_context):
    """Produces a valid dictionary matching MantraAIReport schema."""
    ev_id = sample_evidence_context.items[0].evidence_id if sample_evidence_context.items else "who-sperm-manual-2021"
    ev_item = sample_evidence_context.items[0] if sample_evidence_context.items else None

    return {
        "report_metadata": {
            "report_version": "2.0",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model_provider": "groq",
            "model_name": "llama-3.3-70b-versatile",
            "questionnaire_version": "1.0",
        },
        "executive_summary": {
            "headline": "Evidence-Grounded Health Context Synthesis",
            "overview": "Comprehensive synthesis of self-reported lifestyle, thermal, and psychosexual health context.",
            "key_themes": ["Thermal Exposure Optimization", "Sleep Consistency", "Sedentary Routine Modulation"],
            "areas_for_attention": ["Daily laptop contact", "Regular tobacco exposure"],
            "positive_context": ["Proactive engagement with comprehensive health screening"],
            "overall_wellness_status": "Several areas need attention",
        },
        "reproductive_health": {
            "summary": "Reported thermal habits and lifestyle factors known to interface with spermatogenic physiology.",
            "reported_context": ["Direct laptop usage on lap daily"],
            "relevant_factors": ["Elevated scrotal temperature is documented to disrupt optimal spermatogenesis"],
            "evidence_refs": [ev_id],
            "limitations": ["Questionnaire context is not a substitute for formal semen analysis."],
        },
        "sexual_health": {
            "summary": "Reported occasional situational performance strain and erectile confidence variance.",
            "reported_context": ["Occasional situational strain reported"],
            "relevant_factors": ["Autonomic nervous system tone and work stress interface with sexual response"],
            "evidence_refs": [ev_id],
            "limitations": ["Subjective psychosexual measures reflect normal physiological fluctuation."],
        },
        "mental_behavioral_wellness": {
            "summary": "Screening indicator suggests elevated perceived workload stress and short sleep duration.",
            "reported_context": ["PSS-10 screening indicator elevated"],
            "relevant_factors": ["Chronic sympathetic activation can disrupt endocrine homeostasis"],
            "evidence_refs": [ev_id],
            "limitations": ["Screening indicators do not constitute formal psychological or psychiatric diagnosis."],
        },
        "lifestyle_wellness": {
            "summary": "Desk-bound daily routine with sedentary duration exceeding 8 hours per day.",
            "relevant_factors": ["Sedentary behavior interfaces with pelvic circulation and metabolic health"],
            "evidence_refs": [ev_id],
            "limitations": ["Self-reported physical activity estimates."],
        },
        "environmental_exposure": {
            "summary": "Direct thermal conductive exposure from daily laptop placement.",
            "relevant_factors": ["Testicular thermoregulation requires 2-4°C below core body temperature"],
            "evidence_refs": [ev_id],
            "limitations": ["Observational evidence reflects population averages."],
        },
        "substance_medication": {
            "summary": "Regular tobacco use and daily over-the-counter wellness supplement intake.",
            "relevant_factors": ["Tobacco exposure increases seminal oxidative stress biomarkers"],
            "evidence_refs": [ev_id],
            "limitations": ["Supplement interactions should be reviewed with a clinician."],
        },
        "priority_factors": [
            {
                "id": "pf_01",
                "domain": "environmental_exposure",
                "title": "Direct Laptop Heat Exposure",
                "description": "Daily conductive heat exposure from laptop placement on lap.",
                "source_question_ids": ["laptop_on_lap"],
                "evidence_refs": [ev_id],
                "actionable": True,
                "severity": "moderate",
            }
        ],
        "positive_factors": [
            {
                "id": "pos_01",
                "domain": "lifestyle_wellness",
                "title": "Comprehensive Screening Completion",
                "description": "Demonstrates proactive health awareness and commitment to preventive optimization.",
                "source_question_ids": ["age_years"],
                "evidence_refs": [ev_id],
            }
        ],
        "personalized_action_plan": [
            {
                "id": "act_01",
                "title": "Transition Laptop to Desk Surface",
                "description": "Place laptop on a desk or cooling pad to eliminate direct scrotal conductive heating.",
                "domain": "environmental_exposure",
                "rationale": "Clinical guidelines indicate conductive thermal reduction supports testicular homeostasis.",
                "evidence_refs": [ev_id],
                "timeframe": "Immediate (1-2 days)",
                "action_type": "lifestyle",
                "priority": 1,
            }
        ],
        "questions_to_discuss_with_clinician": [
            {
                "id": "cq_01",
                "question": "What preventive reproductive or lifestyle evaluations are appropriate for my profile?",
                "domain": "reproductive_health",
                "reason": "Address thermal and tobacco exposure history.",
            }
        ],
        "when_to_seek_professional_help": [
            {
                "trigger": "Persistent reproductive concerns or conceiving delay > 12 months",
                "explanation": "Standard clinical guideline threshold for comprehensive male reproductive evaluation.",
                "urgency": "timely",
            }
        ],
        "evidence": [
            {
                "evidence_id": ev_id,
                "title": ev_item.title if ev_item else "WHO Laboratory Manual for the Examination and Processing of Human Semen",
                "source": ev_item.source if ev_item else "WHO",
                "year": ev_item.publication_year if ev_item else 2021,
                "url": ev_item.url if ev_item else "https://www.who.int/publications/i/item/9789240030787",
                "source_identifier": ev_item.source_identifier if ev_item else "ISBN: 9789240030787",
                "relevance": ev_item.relevance_reason if ev_item else "Authoritative global standard.",
            }
        ],
        "limitations": {
            "summary": "Pre-clinical digital assessment based on self-reported responses.",
            "methodology_notes": [
                "Not a substitute for semen analysis, hormone profiling, or urological exam.",
            ],
            "items": [
                "Observational guidelines inform population trends rather than individual clinical proof.",
            ],
        },
        "disclaimer": "MantraAI is an evidence-informed wellness platform. This report does NOT constitute medical diagnosis or fertility prediction.",
    }


def create_mock_groq_response(content_dict: dict):
    """Helper to mock urllib response returning a Groq JSON completion."""
    mock_resp = MagicMock()
    body_str = json.dumps({
        "id": "chatcmpl-test-123",
        "object": "chat.completion",
        "created": 1720000000,
        "model": "llama-3.3-70b-versatile",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": json.dumps(content_dict),
                },
                "finish_reason": "stop",
            }
        ]
    })
    mock_resp.read.return_value = body_str.encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp
    mock_resp.__exit__.return_value = False
    return mock_resp


# ===========================================================================
# 1. Valid Structured Groq Response
# ===========================================================================

def test_valid_structured_groq_response(sample_normalized, sample_health_context, sample_evidence_context, valid_report_dict):
    """When Groq returns valid structured JSON, generate_mantra_report validates and returns MantraAIReport."""
    mock_response = create_mock_groq_response(valid_report_dict)

    with patch("urllib.request.urlopen", return_value=mock_response):
        report = generate_mantra_report(
            normalized_assessment=sample_normalized,
            health_context=sample_health_context,
            evidence_context=sample_evidence_context,
            api_key="gsk_test_valid_key_123",
        )

    assert isinstance(report, MantraAIReport)
    assert report.report_metadata.report_version == "2.0"
    assert report.executive_summary.headline == "Evidence-Grounded Health Context Synthesis"
    assert len(report.priority_factors) == 1
    assert len(report.evidence) >= 1


# ===========================================================================
# 2. Pydantic Validation Success
# ===========================================================================

def test_pydantic_validation_success(valid_report_dict, sample_evidence_context):
    """validate_report_content succeeds with a fully populated valid report dictionary."""
    report = validate_report_content(valid_report_dict, sample_evidence_context)
    assert isinstance(report, MantraAIReport)
    assert report.executive_summary.overall_wellness_status in ["Stable", "Worth monitoring", "Several areas need attention"]


# ===========================================================================
# 3. Invalid JSON Handling
# ===========================================================================

def test_invalid_json_handling(sample_evidence_context):
    """Malformed non-JSON string raises MalformedReportJSONError."""
    with pytest.raises(MalformedReportJSONError):
        validate_report_content("This is not a JSON object {broken", sample_evidence_context)


# ===========================================================================
# 4. Missing Required Report Section
# ===========================================================================

def test_missing_required_section_raises(valid_report_dict, sample_evidence_context):
    """Missing any mandatory section (e.g. reproductive_health) raises ReportValidationError."""
    corrupted = dict(valid_report_dict)
    del corrupted["reproductive_health"]

    with pytest.raises(ReportValidationError):
        validate_report_content(corrupted, sample_evidence_context)


# ===========================================================================
# 5. Forbidden Diagnosis Field Rejection
# ===========================================================================

def test_forbidden_diagnosis_field_rejected(valid_report_dict, sample_evidence_context):
    """Presence of forbidden 'diagnosis' key raises ReportValidationError."""
    corrupted = dict(valid_report_dict)
    corrupted["diagnosis"] = "Primary Hypogonadism"

    with pytest.raises(ReportValidationError) as exc_info:
        validate_report_content(corrupted, sample_evidence_context)
    assert "Forbidden diagnostic" in str(exc_info.value)


# ===========================================================================
# 6. Forbidden Fertility Probability Rejection
# ===========================================================================

def test_forbidden_fertility_probability_rejected(valid_report_dict, sample_evidence_context):
    """Presence of forbidden 'fertility_probability' raises ReportValidationError."""
    corrupted = dict(valid_report_dict)
    corrupted["fertility_probability"] = 0.82

    with pytest.raises(ReportValidationError) as exc_info:
        validate_report_content(corrupted, sample_evidence_context)
    assert "Forbidden diagnostic" in str(exc_info.value)


# ===========================================================================
# 7. Unknown Evidence ID Rejection
# ===========================================================================

def test_unknown_evidence_id_rejected(valid_report_dict, sample_evidence_context):
    """Citing an unknown hallucinated evidence ID raises InvalidEvidenceReferenceError."""
    corrupted = json.loads(json.dumps(valid_report_dict))
    corrupted["priority_factors"][0]["evidence_refs"] = ["hallucinated-fake-study-2025"]

    with pytest.raises(InvalidEvidenceReferenceError) as exc_info:
        validate_report_content(corrupted, sample_evidence_context)
    assert "Unknown evidence_id 'hallucinated-fake-study-2025'" in str(exc_info.value)


# ===========================================================================
# 8. Unknown Question ID Rejection
# ===========================================================================

def test_unknown_question_id_rejected(valid_report_dict, sample_evidence_context):
    """Citing an invented question ID in priority factors raises InvalidQuestionIdError."""
    corrupted = json.loads(json.dumps(valid_report_dict))
    corrupted["priority_factors"][0]["source_question_ids"] = ["invented_nonexistent_question"]

    with pytest.raises(InvalidQuestionIdError) as exc_info:
        validate_report_content(corrupted, sample_evidence_context)
    assert "Unknown source_question_id 'invented_nonexistent_question'" in str(exc_info.value)


# ===========================================================================
# 9. Valid Evidence References Accepted
# ===========================================================================

def test_valid_evidence_references_accepted(valid_report_dict, sample_evidence_context):
    """Evidence references that match EvidenceContext pass without error."""
    report = validate_report_content(valid_report_dict, sample_evidence_context)
    assert len(report.evidence) >= 1
    assert report.evidence[0].url.startswith("http")


# ===========================================================================
# 10. Valid Question IDs Accepted
# ===========================================================================

def test_valid_question_ids_accepted(valid_report_dict, sample_evidence_context):
    """Question IDs from QUESTION_DOMAIN_MAP pass validation."""
    report = validate_report_content(valid_report_dict, sample_evidence_context)
    for factor in report.priority_factors:
        for q_id in factor.source_question_ids:
            assert q_id in QUESTION_DOMAIN_MAP


# ===========================================================================
# 11. Retry After Validation Failure
# ===========================================================================

def test_retry_after_validation_failure(sample_normalized, sample_health_context, sample_evidence_context, valid_report_dict):
    """If attempt 1 fails validation (e.g. invalid JSON), attempt 2 succeeds."""
    mock_bad_resp = MagicMock()
    mock_bad_resp.read.return_value = json.dumps({
        "choices": [{"message": {"content": "Not JSON at all"}}]
    }).encode("utf-8")
    mock_bad_resp.__enter__.return_value = mock_bad_resp
    mock_bad_resp.__exit__.return_value = False

    mock_good_resp = create_mock_groq_response(valid_report_dict)

    with patch("urllib.request.urlopen", side_effect=[mock_bad_resp, mock_good_resp]) as mock_call:
        report = generate_mantra_report(
            normalized_assessment=sample_normalized,
            health_context=sample_health_context,
            evidence_context=sample_evidence_context,
            api_key="gsk_test_key_123",
        )

    assert mock_call.call_count == 2
    assert isinstance(report, MantraAIReport)
    assert report.report_metadata.model_provider == "groq"


# ===========================================================================
# 12. Stop After Maximum Retries
# ===========================================================================

def test_stop_after_max_retries_returns_fallback(sample_normalized, sample_health_context, sample_evidence_context):
    """When all 3 attempts fail, generate_mantra_report returns a valid fallback report."""
    mock_bad_resp = MagicMock()
    mock_bad_resp.read.return_value = json.dumps({
        "choices": [{"message": {"content": "Broken payload"}}]
    }).encode("utf-8")
    mock_bad_resp.__enter__.return_value = mock_bad_resp
    mock_bad_resp.__exit__.return_value = False

    with patch("urllib.request.urlopen", side_effect=[mock_bad_resp, mock_bad_resp, mock_bad_resp]) as mock_call:
        with patch("time.sleep", return_value=None):
            report = generate_mantra_report(
                normalized_assessment=sample_normalized,
                health_context=sample_health_context,
                evidence_context=sample_evidence_context,
                api_key="gsk_test_key_123",
            )

    assert mock_call.call_count == 3
    assert isinstance(report, MantraAIReport)
    assert report.report_metadata.model_provider == "system_fallback"
    assert report.report_metadata.model_name == "deterministic_fallback"


# ===========================================================================
# 13. Authentication Error Does Not Blindly Retry
# ===========================================================================

def test_auth_error_halts_retries_immediately(sample_normalized, sample_health_context, sample_evidence_context):
    """HTTP 401/403 fails immediately without making further retries."""
    http_err = urllib.error.HTTPError(
        url="https://api.groq.com",
        code=401,
        msg="Unauthorized",
        hdrs={},
        fp=MagicMock(),
    )

    with patch("urllib.request.urlopen", side_effect=http_err) as mock_call:
        report = generate_mantra_report(
            normalized_assessment=sample_normalized,
            health_context=sample_health_context,
            evidence_context=sample_evidence_context,
            api_key="invalid_key",
        )

    # Must have stopped after exactly 1 attempt
    assert mock_call.call_count == 1
    assert isinstance(report, MantraAIReport)
    assert report.report_metadata.model_provider == "system_fallback"


# ===========================================================================
# 14. Timeout Handling
# ===========================================================================

def test_timeout_handling_retries(sample_normalized, sample_health_context, sample_evidence_context, valid_report_dict):
    """Timeout on attempt 1 triggers retry and recovers on attempt 2."""
    timeout_err = TimeoutError("Connection timed out after 30s")
    mock_good_resp = create_mock_groq_response(valid_report_dict)

    with patch("urllib.request.urlopen", side_effect=[timeout_err, mock_good_resp]) as mock_call:
        with patch("time.sleep", return_value=None):
            report = generate_mantra_report(
                normalized_assessment=sample_normalized,
                health_context=sample_health_context,
                evidence_context=sample_evidence_context,
                api_key="gsk_test_key_123",
            )

    assert mock_call.call_count == 2
    assert isinstance(report, MantraAIReport)
    assert report.report_metadata.model_provider == "groq"


# ===========================================================================
# 15. Rate-Limit Handling
# ===========================================================================

def test_rate_limit_handling_backs_off(sample_normalized, sample_health_context, sample_evidence_context, valid_report_dict):
    """HTTP 429 rate limit triggers backoff sleep and recovers on attempt 2."""
    rate_limit_err = urllib.error.HTTPError(
        url="https://api.groq.com",
        code=429,
        msg="Too Many Requests",
        hdrs={},
        fp=MagicMock(),
    )
    mock_good_resp = create_mock_groq_response(valid_report_dict)

    with patch("urllib.request.urlopen", side_effect=[rate_limit_err, mock_good_resp]) as mock_call:
        with patch("time.sleep", return_value=None) as mock_sleep:
            report = generate_mantra_report(
                normalized_assessment=sample_normalized,
                health_context=sample_health_context,
                evidence_context=sample_evidence_context,
                api_key="gsk_test_key_123",
            )

    assert mock_call.call_count == 2
    assert mock_sleep.call_count == 1
    assert isinstance(report, MantraAIReport)


# ===========================================================================
# 16. Successful Persistence & Integration with Router
# ===========================================================================

def test_successful_persistence_via_complete_endpoint(valid_report_dict):
    """When complete_assessment is called, report is generated and persisted."""
    from app.routers.assessment import complete_assessment
    from app.models.user import User
    from app.models.assessment import AssessmentSession, AssessmentResponse, Report

    # Use existing test user or mock auth
    test_user_id = uuid4()
    session_id = uuid4()

    mock_db = MagicMock()
    mock_user = User(id=test_user_id, email="test@mantra.ai")
    mock_session = AssessmentSession(
        id=session_id,
        user_id=test_user_id,
        status="IN_PROGRESS",
        started_at=datetime.utcnow()
    )
    mock_resp1 = AssessmentResponse(
        assessment_session_id=session_id,
        question_id="age_years",
        response_value=28,
    )
    mock_resp2 = AssessmentResponse(
        assessment_session_id=session_id,
        question_id="laptop_on_lap",
        response_value="daily_2plus_hours",
    )

    # Configure mock DB queries
    def filter_side_effect(*args, **kwargs):
        query_mock = MagicMock()
        query_mock.first.return_value = mock_session
        query_mock.all.return_value = [mock_resp1, mock_resp2]
        return query_mock

    mock_db.query.return_value.filter.side_effect = filter_side_effect

    mock_groq_resp = create_mock_groq_response(valid_report_dict)

    with patch("app.auth.firebase_auth.get_current_user", return_value=mock_user):
        with patch("app.database.get_db", return_value=mock_db):
            with patch("urllib.request.urlopen", return_value=mock_groq_resp):
                # We can call complete_assessment logic directly
                from app.routers.assessment import complete_assessment
                result = complete_assessment(assessment_id=session_id, db=mock_db, current_user=mock_user)

    assert result is not None
    assert mock_session.status == "COMPLETED"
    assert mock_db.add.call_count >= 2  # Result, Report, Audit


# ===========================================================================
# 17. Invalid Report is Never Persisted as Final
# ===========================================================================

def test_invalid_report_never_persisted_as_final(sample_normalized, sample_health_context, sample_evidence_context):
    """When Groq repeatedly outputs invalid schema, fallback is returned; invalid JSON is never passed."""
    mock_broken = MagicMock()
    mock_broken.read.return_value = json.dumps({
        "choices": [{"message": {"content": json.dumps({"corrupted": True, "fertility_probability": 0.99})}}]
    }).encode("utf-8")
    mock_broken.__enter__.return_value = mock_broken
    mock_broken.__exit__.return_value = False

    with patch("urllib.request.urlopen", side_effect=[mock_broken, mock_broken, mock_broken]):
        with patch("time.sleep", return_value=None):
            report = generate_mantra_report(
                normalized_assessment=sample_normalized,
                health_context=sample_health_context,
                evidence_context=sample_evidence_context,
                api_key="gsk_test_key_123",
            )

    assert isinstance(report, MantraAIReport)
    assert report.report_metadata.model_provider == "system_fallback"
    # Ensure no forbidden fields exist in output
    serialized = json.dumps(report.model_dump())
    assert "fertility_probability" not in serialized
    assert "corrupted" not in serialized


# ===========================================================================
# 18. Backward-Compatible API Response
# ===========================================================================

def test_backward_compatible_api_response(valid_report_dict, sample_evidence_context):
    """new_report_to_legacy_view produces dictionary with required frontend keys."""
    report = validate_report_content(valid_report_dict, sample_evidence_context)
    legacy = new_report_to_legacy_view(report)

    assert "summary" in legacy
    assert "headline" in legacy["summary"]
    assert "overview" in legacy["summary"]
    assert "key_findings" in legacy
    assert "priority_actions" in legacy
    assert "disclaimer" in legacy


# ===========================================================================
# 19. Existing ReportViewer Contract Still Works
# ===========================================================================

def test_existing_report_viewer_contract_fulfilled(valid_report_dict, sample_evidence_context):
    """All keys consumed by ReportViewer.jsx exist and have expected types."""
    report = validate_report_content(valid_report_dict, sample_evidence_context)
    legacy = new_report_to_legacy_view(report)

    # ReportViewer.jsx checks:
    # 1. report.summary.headline
    assert isinstance(legacy["summary"]["headline"], str)
    # 2. report.summary.overview
    assert isinstance(legacy["summary"]["overview"], str)
    # 3. report.model_name
    assert isinstance(legacy["model_name"], str)
    # 4. report.key_findings mapping (title, severity, explanation, evidence)
    assert isinstance(legacy["key_findings"], list)
    if legacy["key_findings"]:
        kf = legacy["key_findings"][0]
        assert "title" in kf and "severity" in kf and "explanation" in kf
    # 5. report.reproductive_health.summary
    assert isinstance(legacy["reproductive_health"]["summary"], str)
    # 6. report.sexual_health.summary
    assert isinstance(legacy["sexual_health"]["summary"], str)
    # 7. report.priority_actions mapping (priority, area, action, reason)
    assert isinstance(legacy["priority_actions"], list)
    if legacy["priority_actions"]:
        pa = legacy["priority_actions"][0]
        assert "priority" in pa and "area" in pa and "action" in pa and "reason" in pa
    # 8. report.disclaimer
    assert isinstance(legacy["disclaimer"], str)


# ===========================================================================
# 20. No Sensitive Payload Appears in Logs
# ===========================================================================

def test_no_sensitive_payload_in_logs(caplog, sample_normalized, sample_health_context, sample_evidence_context, valid_report_dict):
    """Log outputs contain attempt counts, durations, but ZERO raw sensitive health answers."""
    caplog.set_level(logging.DEBUG)

    mock_resp = create_mock_groq_response(valid_report_dict)

    with patch("urllib.request.urlopen", return_value=mock_resp):
        report = generate_mantra_report(
            normalized_assessment=sample_normalized,
            health_context=sample_health_context,
            evidence_context=sample_evidence_context,
            api_key="gsk_test_key_123",
        )

    all_logs = " ".join([record.message for record in caplog.records])

    # Sensitive values in synthetic answers
    assert "daily_2plus_hours" not in all_logs
    assert "erectile_confidence" not in all_logs
    assert "occasional" not in all_logs
    assert "ashwagandha" not in all_logs
    # Technical logs should be present
    assert "Report generation succeeded on attempt" in all_logs


# ===========================================================================
# 21. End-to-End Pipeline Test
# ===========================================================================

def test_end_to_end_pipeline(synthetic_answers, valid_report_dict):
    """
    Full pipeline validation:
    Raw answers → normalizer → context engine → evidence retrieval → mocked Groq → MantraAIReport validation.
    """
    # 1. Normalize
    normalized = normalize_assessment_responses(synthetic_answers)
    assert isinstance(normalized, NormalizedAssessment)

    # 2. Build HealthContext
    health_ctx = build_health_context(normalized)
    assert isinstance(health_ctx, HealthContext)
    assert len(health_ctx.evidence_tags) > 0

    # 3. Retrieve Evidence
    evidence_ctx = retrieve_evidence_for_health_context(health_ctx)
    assert isinstance(evidence_ctx, EvidenceContext)
    assert evidence_ctx.matched_count > 0

    # 4. Generate & Validate Report
    mock_resp = create_mock_groq_response(valid_report_dict)
    with patch("urllib.request.urlopen", return_value=mock_resp):
        report = generate_mantra_report(
            normalized_assessment=normalized,
            health_context=health_ctx,
            evidence_context=evidence_ctx,
            api_key="gsk_test_key_123",
        )

    assert isinstance(report, MantraAIReport)
    assert report.report_metadata.report_version == "2.0"
    assert report.disclaimer is not None
    assert len(report.positive_factors) > 0
    assert len(report.personalized_action_plan) > 0
