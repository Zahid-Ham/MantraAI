"""
MantraAI - Longitudinal Assessment Intelligence Tests (Phase 1D)
================================================================

Comprehensive deterministic unit and API integration tests for longitudinal assessment comparison.
Covers:
1. First assessment with no comparison target (baseline response).
2. Previous-assessment default selection.
3. Explicit target selection.
4. Categorical factor transitions:
   - NEWLY_REPORTED
   - NO_LONGER_REPORTED
   - PERSISTENT
   - POSITIVE_ADOPTED
   - POSITIVE_MAINTAINED
   - POSITIVE_LAPSED
5. Missing versus explicitly negative answers.
6. Incompatible questionnaire versions.
7. Historical conditions not incorrectly marked medically resolved.
8. Cross-user access denial (403/404).
9. Incomplete or in-progress assessments (400).
10. Attempting to compare an assessment to itself (400).
11. Non-existent assessment session (404).
12. Wellness Plan adherence context (non-causal observational records).
13. Zero external LLM calls (mocked Groq verify 0 calls).
14. Strict schema validation (extra='forbid', no diagnostic/fertility percentage/pseudo-scores).
"""

import sys
import os
from uuid import uuid4
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.database import Base, get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report
from app.models.wellness_plan import WellnessPlan, WellnessActionItem, WellnessActionLog
from app.schemas.longitudinal import (
    AssessmentComparisonOut,
    FactorDeltaItem,
    FORBIDDEN_LONGITUDINAL_FIELDS,
)
from app.services.longitudinal_service import LongitudinalService
from app.security.rate_limiter import reset_rate_limits


# Setup isolated SQLite test database engine
TEST_DB_URL = "sqlite:///./test_longitudinal.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


TEST_USER_1_ID = uuid4()
TEST_USER_2_ID = uuid4()
current_mock_user_id = TEST_USER_1_ID


def override_get_current_user(db: Session = pytest.importorskip("fastapi").Depends(override_get_db)):
    if not current_mock_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing authentication token.")
    user = db.query(User).filter(User.id == current_mock_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_teardown_db():
    global current_mock_user_id
    current_mock_user_id = TEST_USER_1_ID
    reset_rate_limits()
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    db = TestingSessionLocal()
    # Teardown any existing records
    db.query(WellnessActionLog).delete()
    db.query(WellnessActionItem).delete()
    db.query(WellnessPlan).delete()
    db.query(Report).delete()
    db.query(AssessmentResult).delete()
    db.query(AssessmentResponse).delete()
    db.query(AssessmentSession).delete()
    db.query(User).delete()
    db.commit()

    # Create test users
    u1 = User(id=TEST_USER_1_ID, firebase_uid="longitudinal_u1", email="u1@mantraai.test", display_name="User 1")
    u2 = User(id=TEST_USER_2_ID, firebase_uid="longitudinal_u2", email="u2@mantraai.test", display_name="User 2")
    db.add(u1)
    db.add(u2)
    db.commit()
    db.close()

    yield

    db = TestingSessionLocal()
    db.query(WellnessActionLog).delete()
    db.query(WellnessActionItem).delete()
    db.query(WellnessPlan).delete()
    db.query(Report).delete()
    db.query(AssessmentResult).delete()
    db.query(AssessmentResponse).delete()
    db.query(AssessmentSession).delete()
    db.query(User).delete()
    db.commit()
    db.close()
    app.dependency_overrides.clear()


def _create_mock_session(
    db: Session,
    user_id,
    status="COMPLETED",
    version="1.0",
    completed_at=None,
    responses_dict=None,
    report_content_dict=None,
):
    session = AssessmentSession(
        id=uuid4(),
        user_id=user_id,
        assessment_version=version,
        status=status,
        started_at=(completed_at or datetime.utcnow()) - timedelta(minutes=15),
        completed_at=completed_at or datetime.utcnow(),
    )
    db.add(session)
    db.flush()

    if responses_dict:
        for q_id, q_val in responses_dict.items():
            resp = AssessmentResponse(
                id=uuid4(),
                assessment_session_id=session.id,
                question_id=q_id,
                response_value=q_val,
            )
            db.add(resp)

    if report_content_dict is not None:
        report = Report(
            id=uuid4(),
            assessment_session_id=session.id,
            report_version="1.0",
            model_provider="deterministic_pipeline",
            model_name="mantra-engine-v1",
            report_content=report_content_dict,
            structured_findings=[],
        )
        db.add(report)

    db.commit()
    db.refresh(session)
    return session


# ============================================================================
# 1. First Assessment (Baseline Response)
# ============================================================================

def test_first_assessment_returns_clean_baseline():
    """When a user has only one completed assessment, return a clear baseline comparison response."""
    db = TestingSessionLocal()
    s1 = _create_mock_session(
        db,
        user_id=TEST_USER_1_ID,
        responses_dict={"sleep_hours": "7", "smoking": "Never"},
        report_content_dict={
            "lifestyle_wellness": {
                "risk_factors": ["High Stress"],
                "positive_habits": ["Regular Sleep"],
            }
        },
    )

    resp = client.get(f"/api/v1/assessments/{s1.id}/compare")
    assert resp.status_code == 200
    data = resp.json()

    meta = data["comparison_metadata"]
    assert meta["has_comparison"] is False
    assert meta["comparison_type"] == "BASELINE_ONLY"
    assert meta["comparison_target_id"] is None
    assert meta["current_assessment_id"] == str(s1.id)
    assert meta["elapsed_days"] is None

    # Baseline domain entries exist with persistent counts matching baseline
    assert len(data["domains"]) == 6
    lifestyle = next(d for d in data["domains"] if d["domain_key"] == "lifestyle_wellness")
    assert lifestyle["persistent_count"] == 1
    assert lifestyle["positive_maintained_count"] == 1

    # Ensure schema validation against strict Pydantic model
    comparison_obj = AssessmentComparisonOut(**data)
    assert comparison_obj.comparison_metadata.has_comparison is False


# ============================================================================
# 2. Previous-Assessment Default Selection
# ============================================================================

def test_defaults_to_immediately_preceding_completed_assessment():
    """When target_id is omitted, default to the previous completed assessment chronologically."""
    db = TestingSessionLocal()
    t1 = datetime.utcnow() - timedelta(days=30)
    t2 = datetime.utcnow() - timedelta(days=5)

    s1 = _create_mock_session(
        db,
        user_id=TEST_USER_1_ID,
        completed_at=t1,
        responses_dict={"sleep_hours": "5"},
        report_content_dict={
            "lifestyle_wellness": {
                "risk_factors": ["Poor Sleep Duration"],
                "positive_habits": [],
            }
        },
    )
    s2 = _create_mock_session(
        db,
        user_id=TEST_USER_1_ID,
        completed_at=t2,
        responses_dict={"sleep_hours": "8"},
        report_content_dict={
            "lifestyle_wellness": {
                "risk_factors": [],
                "positive_habits": ["Optimal Sleep Duration"],
            }
        },
    )

    resp = client.get(f"/api/v1/assessments/{s2.id}/compare")
    assert resp.status_code == 200
    data = resp.json()

    meta = data["comparison_metadata"]
    assert meta["has_comparison"] is True
    assert meta["comparison_type"] == "PREVIOUS_COMPLETED"
    assert meta["current_assessment_id"] == str(s2.id)
    assert meta["comparison_target_id"] == str(s1.id)
    assert meta["elapsed_days"] == 25


# ============================================================================
# 3. Explicit Target Selection
# ============================================================================

def test_explicit_target_assessment_selection():
    """User can select an earlier historical assessment explicitly via target_id."""
    db = TestingSessionLocal()
    t1 = datetime.utcnow() - timedelta(days=60)
    t2 = datetime.utcnow() - timedelta(days=30)
    t3 = datetime.utcnow() - timedelta(days=2)

    s1 = _create_mock_session(db, user_id=TEST_USER_1_ID, completed_at=t1, report_content_dict={"lifestyle_wellness": {"risk_factors": ["Smoking"]}})
    s2 = _create_mock_session(db, user_id=TEST_USER_1_ID, completed_at=t2, report_content_dict={"lifestyle_wellness": {"risk_factors": ["Smoking"]}})
    s3 = _create_mock_session(db, user_id=TEST_USER_1_ID, completed_at=t3, report_content_dict={"lifestyle_wellness": {"risk_factors": []}})

    # Default would compare s3 with s2. Request explicit comparison with s1:
    resp = client.get(f"/api/v1/assessments/{s3.id}/compare?target_id={s1.id}")
    assert resp.status_code == 200
    data = resp.json()

    meta = data["comparison_metadata"]
    assert meta["has_comparison"] is True
    assert meta["comparison_type"] == "USER_SELECTED"
    assert meta["current_assessment_id"] == str(s3.id)
    assert meta["comparison_target_id"] == str(s1.id)
    assert meta["elapsed_days"] == 58


# ============================================================================
# 4. Factor Transitions (Newly Reported, No Longer Reported, Persistent, Habits)
# ============================================================================

def test_factor_transition_classifications():
    """Correctly classify all factor transition states without clinical cure claims."""
    db = TestingSessionLocal()
    t1 = datetime.utcnow() - timedelta(days=14)
    t2 = datetime.utcnow()

    # Target: High Stress, Poor Sleep; Positive Habit: Daily Walking
    s1 = _create_mock_session(
        db,
        user_id=TEST_USER_1_ID,
        completed_at=t1,
        report_content_dict={
            "lifestyle_wellness": {
                "risk_factors": [
                    {"id": "stress", "title": "High Stress", "is_risk": True},
                    {"id": "poor_sleep", "title": "Poor Sleep Duration", "is_risk": True},
                ],
                "positive_habits": [
                    {"id": "walking", "title": "Daily Walking", "is_risk": False},
                ],
            }
        },
    )

    # Current: High Stress (persistent), Sedentary Job (newly reported),
    # Poor Sleep Duration is gone (no longer reported),
    # Daily Walking maintained, Clean Diet adopted (positive adopted).
    s2 = _create_mock_session(
        db,
        user_id=TEST_USER_1_ID,
        completed_at=t2,
        report_content_dict={
            "lifestyle_wellness": {
                "risk_factors": [
                    {"id": "stress", "title": "High Stress", "is_risk": True},
                    {"id": "sedentary", "title": "Sedentary Desk Work", "is_risk": True},
                ],
                "positive_habits": [
                    {"id": "walking", "title": "Daily Walking", "is_risk": False},
                    {"id": "clean_diet", "title": "Clean Whole Food Diet", "is_risk": False},
                ],
            }
        },
    )

    resp = client.get(f"/api/v1/assessments/{s2.id}/compare?target_id={s1.id}")
    assert resp.status_code == 200
    data = resp.json()

    lifestyle = next(d for d in data["domains"] if d["domain_key"] == "lifestyle_wellness")
    transitions = {f["title"]: f["transition_type"] for f in lifestyle["factors"]}

    assert transitions["High Stress"] == "PERSISTENT"
    assert transitions["Sedentary Desk Work"] == "NEWLY_REPORTED"
    assert transitions["Poor Sleep Duration"] == "NO_LONGER_REPORTED"
    assert transitions["Daily Walking"] == "POSITIVE_MAINTAINED"
    assert transitions["Clean Whole Food Diet"] == "POSITIVE_ADOPTED"

    # Verify observational note uses non-curing clinical language
    no_longer_factor = next(f for f in lifestyle["factors"] if f["title"] == "Poor Sleep Duration")
    assert "no longer reported" in no_longer_factor["explanation"].lower()
    assert "cure" not in no_longer_factor["explanation"].lower()
    assert "healed" not in no_longer_factor["explanation"].lower()


# ============================================================================
# 5. Missing versus Explicitly Negative Answers
# ============================================================================

def test_missing_vs_explicitly_negative_responses():
    """Unanswered questions must not be treated as resolved health conditions."""
    db = TestingSessionLocal()
    t1 = datetime.utcnow() - timedelta(days=20)
    t2 = datetime.utcnow()

    # Target had testicular/scrotal symptom
    s1 = _create_mock_session(
        db,
        user_id=TEST_USER_1_ID,
        completed_at=t1,
        responses_dict={"scrotal_or_groin_injury": "Yes"},
        report_content_dict={
            "reproductive_health": {
                "risk_factors": [
                    {"id": "groin_injury", "title": "Scrotal or Groin Injury", "source_question_ids": ["scrotal_or_groin_injury"]},
                ],
                "positive_habits": [],
            }
        },
    )

    # Current has scrotal_or_groin_injury completely missing/unanswered
    s2 = _create_mock_session(
        db,
        user_id=TEST_USER_1_ID,
        completed_at=t2,
        responses_dict={"sleep_hours": "8"},  # scrotal_or_groin_injury omitted
        report_content_dict={
            "reproductive_health": {
                "risk_factors": [],
                "positive_habits": [],
            }
        },
    )

    resp = client.get(f"/api/v1/assessments/{s2.id}/compare?target_id={s1.id}")
    assert resp.status_code == 200
    data = resp.json()

    repro = next(d for d in data["domains"] if d["domain_key"] == "reproductive_health")
    injury_factor = next((f for f in repro["factors"] if "injury" in f["title"].lower()), None)
    assert injury_factor is not None
    # Must be classified as historical condition or newly recorded / unverified context, NOT no_longer_reported/cured
    assert injury_factor["transition_type"] in ("HISTORICAL_CONDITION_NOT_RECORDED", "NEWLY_RECORDED_CONTEXT")
    assert "cure" not in injury_factor["explanation"].lower()


# ============================================================================
# 6. Incompatible Questionnaire Versions
# ============================================================================

def test_questionnaire_version_mismatch_flagged():
    """Different assessment versions (e.g. 1.0 vs 2.0) are flagged transparently."""
    db = TestingSessionLocal()
    t1 = datetime.utcnow() - timedelta(days=10)
    t2 = datetime.utcnow()

    s1 = _create_mock_session(db, user_id=TEST_USER_1_ID, version="1.0", completed_at=t1, report_content_dict={"lifestyle_wellness": {"risk_factors": []}})
    s2 = _create_mock_session(db, user_id=TEST_USER_1_ID, version="2.0", completed_at=t2, report_content_dict={"lifestyle_wellness": {"risk_factors": []}})

    resp = client.get(f"/api/v1/assessments/{s2.id}/compare?target_id={s1.id}")
    assert resp.status_code == 200
    data = resp.json()

    meta = data["comparison_metadata"]
    assert meta["schema_compatibility"] == "VERSION_MISMATCH_PARTIAL"
    assert len(meta["compatibility_notes"]) > 0
    assert "version changed from 1.0 to 2.0" in meta["compatibility_notes"][0].lower()


# ============================================================================
# 7. Historical Conditions Never Marked Medically Resolved
# ============================================================================

def test_historical_condition_not_marked_medically_resolved():
    """Conditions like prior mumps or surgical trauma must not be claimed cured when omitted."""
    db = TestingSessionLocal()
    t1 = datetime.utcnow() - timedelta(days=30)
    t2 = datetime.utcnow()

    s1 = _create_mock_session(
        db,
        user_id=TEST_USER_1_ID,
        completed_at=t1,
        responses_dict={"childhood_disease_mumps": "Yes"},
        report_content_dict={
            "reproductive_health": {
                "risk_factors": [
                    {
                        "id": "mumps",
                        "title": "History of Post-Pubertal Mumps Orchitis",
                        "source_question_ids": ["childhood_disease_mumps"],
                        "is_historical_condition": True,
                    },
                ],
                "positive_habits": [],
            }
        },
    )

    s2 = _create_mock_session(
        db,
        user_id=TEST_USER_1_ID,
        completed_at=t2,
        responses_dict={},
        report_content_dict={
            "reproductive_health": {
                "risk_factors": [],
                "positive_habits": [],
            }
        },
    )

    resp = client.get(f"/api/v1/assessments/{s2.id}/compare?target_id={s1.id}")
    assert resp.status_code == 200
    data = resp.json()

    repro = next(d for d in data["domains"] if d["domain_key"] == "reproductive_health")
    mumps_factor = next((f for f in repro["factors"] if "mumps" in f["title"].lower()), None)
    assert mumps_factor is not None
    assert mumps_factor["transition_type"] == "HISTORICAL_CONDITION_NOT_RECORDED"
    assert "permanent or historical condition" in mumps_factor["explanation"].lower()
    assert "cure" not in mumps_factor["explanation"].lower()


# ============================================================================
# 8. Cross-User Access Denial
# ============================================================================

def test_cross_user_current_assessment_denied():
    """User 1 cannot compare an assessment belonging to User 2."""
    db = TestingSessionLocal()
    s_user2 = _create_mock_session(db, user_id=TEST_USER_2_ID, report_content_dict={})

    # Current mock user is USER_1_ID
    resp = client.get(f"/api/v1/assessments/{s_user2.id}/compare")
    assert resp.status_code in (403, 404)


def test_cross_user_target_assessment_denied():
    """User 1 cannot target an assessment belonging to User 2."""
    db = TestingSessionLocal()
    s_user1 = _create_mock_session(db, user_id=TEST_USER_1_ID, report_content_dict={})
    s_user2 = _create_mock_session(db, user_id=TEST_USER_2_ID, report_content_dict={})

    resp = client.get(f"/api/v1/assessments/{s_user1.id}/compare?target_id={s_user2.id}")
    assert resp.status_code in (403, 404)


# ============================================================================
# 9. Incomplete or In-Progress Assessments
# ============================================================================

def test_cannot_compare_in_progress_assessment():
    """In-progress assessments cannot be compared longitudinally."""
    db = TestingSessionLocal()
    s_in_progress = _create_mock_session(db, user_id=TEST_USER_1_ID, status="IN_PROGRESS")

    resp = client.get(f"/api/v1/assessments/{s_in_progress.id}/compare")
    assert resp.status_code == 400
    assert "incomplete" in resp.json()["detail"].lower()


def test_cannot_target_in_progress_assessment():
    """Target cannot be an in-progress assessment."""
    db = TestingSessionLocal()
    s1_in_progress = _create_mock_session(db, user_id=TEST_USER_1_ID, status="IN_PROGRESS")
    s2_completed = _create_mock_session(db, user_id=TEST_USER_1_ID, status="COMPLETED", report_content_dict={})

    resp = client.get(f"/api/v1/assessments/{s2_completed.id}/compare?target_id={s1_in_progress.id}")
    assert resp.status_code == 400
    assert "completed" in resp.json()["detail"].lower()


def test_cannot_compare_assessment_to_itself():
    """Comparing an assessment with itself is an invalid operation."""
    db = TestingSessionLocal()
    s = _create_mock_session(db, user_id=TEST_USER_1_ID, status="COMPLETED", report_content_dict={})

    resp = client.get(f"/api/v1/assessments/{s.id}/compare?target_id={s.id}")
    assert resp.status_code == 400
    assert "itself" in resp.json()["detail"].lower()


# ============================================================================
# 10. Non-Existent Assessment Session
# ============================================================================

def test_nonexistent_assessment_returns_404():
    """Non-existent UUID returns 404."""
    random_id = uuid4()
    resp = client.get(f"/api/v1/assessments/{random_id}/compare")
    assert resp.status_code == 404


# ============================================================================
# 11. Wellness Plan Adherence Context
# ============================================================================

def test_wellness_plan_adherence_included_when_available():
    """When wellness actions are logged between sessions, provide non-causal observational adherence."""
    db = TestingSessionLocal()
    t1 = datetime.utcnow() - timedelta(days=30)
    t2 = datetime.utcnow()

    s1 = _create_mock_session(db, user_id=TEST_USER_1_ID, completed_at=t1, report_content_dict={"lifestyle_wellness": {"risk_factors": []}})
    s2 = _create_mock_session(db, user_id=TEST_USER_1_ID, completed_at=t2, report_content_dict={"lifestyle_wellness": {"risk_factors": []}})

    # Create wellness plan with 2 items and logs
    plan = WellnessPlan(
        id=uuid4(),
        user_id=TEST_USER_1_ID,
        title="30-Day Routine",
        focus_areas=["lifestyle"],
        status="active",
    )
    db.add(plan)
    db.flush()

    item1 = WellnessActionItem(
        id=uuid4(),
        plan_id=plan.id,
        user_id=TEST_USER_1_ID,
        action_key="stay_hydrated",
        title="Stay Hydrated",
        explanation="Drink water regularly",
        domain="lifestyle_wellness",
    )
    item2 = WellnessActionItem(
        id=uuid4(),
        plan_id=plan.id,
        user_id=TEST_USER_1_ID,
        action_key="ten_min_walk",
        title="10-minute Walk",
        explanation="Take a short walk",
        domain="lifestyle_wellness",
    )
    db.add(item1)
    db.add(item2)
    db.flush()

    log1 = WellnessActionLog(id=uuid4(), user_id=TEST_USER_1_ID, action_item_id=item1.id, date=(datetime.utcnow() - timedelta(days=15)).date(), status="completed")
    log2 = WellnessActionLog(id=uuid4(), user_id=TEST_USER_1_ID, action_item_id=item2.id, date=(datetime.utcnow() - timedelta(days=15)).date(), status="skipped")
    db.add(log1)
    db.add(log2)
    db.commit()

    resp = client.get(f"/api/v1/assessments/{s2.id}/compare?target_id={s1.id}")
    assert resp.status_code == 200
    data = resp.json()

    wellness = data["wellness_plan_context"]
    assert wellness is not None
    assert wellness["has_linked_plan"] is True
    assert wellness["intervening_completed_actions_count"] == 1
    assert wellness["intervening_total_scheduled_actions_count"] == 2
    assert "does not establish clinical causality" in wellness["disclaimer"].lower()


# ============================================================================
# 12. Zero External LLM Calls
# ============================================================================

def test_zero_external_llm_calls_during_comparison():
    """Ensure that Groq or external LLMs are NEVER invoked for longitudinal comparison."""
    db = TestingSessionLocal()
    t1 = datetime.utcnow() - timedelta(days=15)
    t2 = datetime.utcnow()

    s1 = _create_mock_session(db, user_id=TEST_USER_1_ID, completed_at=t1, report_content_dict={"lifestyle_wellness": {"risk_factors": ["High Stress"]}})
    s2 = _create_mock_session(db, user_id=TEST_USER_1_ID, completed_at=t2, report_content_dict={"lifestyle_wellness": {"risk_factors": ["High Stress"]}})

    # Patch urllib or any groq API client
    with patch("urllib.request.urlopen") as mock_url, patch("app.services.report_generator.generate_mantra_report") as mock_rg:
        resp = client.get(f"/api/v1/assessments/{s2.id}/compare?target_id={s1.id}")
        assert resp.status_code == 200
        mock_url.assert_not_called()
        mock_rg.assert_not_called()


# ============================================================================
# 13. Forbidden Fields Check
# ============================================================================

def test_forbidden_fields_excluded_from_response():
    """Ensure no diagnostic claims, fertility probabilities, cure claims, or pseudo-scores appear."""
    db = TestingSessionLocal()
    t1 = datetime.utcnow() - timedelta(days=10)
    t2 = datetime.utcnow()

    s1 = _create_mock_session(db, user_id=TEST_USER_1_ID, completed_at=t1, report_content_dict={"lifestyle_wellness": {"risk_factors": ["Poor Sleep"]}})
    s2 = _create_mock_session(db, user_id=TEST_USER_1_ID, completed_at=t2, report_content_dict={"lifestyle_wellness": {"risk_factors": []}})

    resp = client.get(f"/api/v1/assessments/{s2.id}/compare?target_id={s1.id}")
    assert resp.status_code == 200
    data = resp.json()

    # Recursively ensure no forbidden key exists in response dict
    def assert_no_forbidden_keys(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                assert k not in FORBIDDEN_LONGITUDINAL_FIELDS, f"Forbidden key '{k}' found in response!"
                assert "pseudo" not in k.lower(), f"Potential pseudo-score key '{k}' found!"
                assert "fertility_score" not in k.lower(), f"Fertility score key '{k}' found!"
                assert "cure" not in k.lower(), f"Cure key '{k}' found!"
                assert_no_forbidden_keys(v)
        elif isinstance(obj, list):
            for item in obj:
                assert_no_forbidden_keys(item)

    assert_no_forbidden_keys(data)
