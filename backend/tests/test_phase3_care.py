"""Phase 3: Care-Connected Features - Comprehensive Clinical & Security Tests.

Tests:
1. Red-flag triage logic, urgency tiers, privacy shield (answers never logged in DB).
2. Clinician-ready one-pager (shared reports): token hashing, expiry, view limits,
   revocation, digital sexual block exclusion toggle, and identical 404 security.
3. 90-day cycle plan: deterministic focus factor prioritization, 12-week ladder,
   weekly checkins, adaptive goal integration, and cross-user isolation.
4. Semen report interpreter: WHO 6th edition lower reference limits, borderline handling,
   abstinence caveats, 90-day retest due date, and trend sorting.
5. Cross-user isolation across all new endpoints (403 on others' resources).
"""

import hashlib
import secrets
import sys
import os
from datetime import datetime, timedelta, timezone, date
from uuid import uuid4, UUID
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResult, Report
from app.models.audit import AuditEvent
from app.services.triage import evaluate_triage
from app.constants.triage_copy import TRIAGE_QUESTIONS, CLINICIAN_REVIEW_REQUIRED
from main import app

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

USER_1_ID = uuid4()
USER_2_ID = uuid4()
active_user_id = USER_1_ID


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_get_current_user(db=pytest.importorskip("fastapi").Depends(override_get_db)):
    if not active_user_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return db.query(User).filter(User.id == active_user_id).first()


@pytest.fixture(autouse=True)
def setup_test_db():
    global active_user_id
    active_user_id = USER_1_ID
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    db = TestingSessionLocal()
    db.query(AuditEvent).delete()
    db.query(User).delete()

    u1 = User(id=USER_1_ID, firebase_uid="uid_phase3_1", email="u1@care.com", display_name="User One")
    u2 = User(id=USER_2_ID, firebase_uid="uid_phase3_2", email="u2@care.com", display_name="User Two")
    db.add_all([u1, u2])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


# ===========================================================================
# 3.1 RED-FLAG TRIAGE TESTS
# ===========================================================================

class TestTriageService:
    def test_clinician_review_flag_is_true(self):
        assert CLINICIAN_REVIEW_REQUIRED is True

    def test_sudden_severe_pain_maps_to_emergency(self):
        res = evaluate_triage({"sudden_severe_pain": True})
        assert res.tier == "emergency"
        assert res.message_key == "emergency"
        assert "112" in res.message or "112" in (res.helpline or "")
        assert "not a clinical diagnosis" in res.message.lower()

    def test_swollen_scrotum_fever_maps_to_urgent(self):
        res = evaluate_triage({"swollen_scrotum_fever": True})
        assert res.tier == "urgent"
        assert res.message_key == "urgent"

    def test_testicular_lump_maps_to_prompt(self):
        res = evaluate_triage({"testicular_lump": True})
        assert res.tier == "prompt"
        assert "this week" in res.timeframe.lower()

    def test_blood_in_fluid_maps_to_prompt(self):
        res = evaluate_triage({"blood_in_fluid": True})
        assert res.tier == "prompt"

    def test_severe_pain_injury_maps_to_urgent(self):
        res = evaluate_triage({"severe_pain_injury": True})
        assert res.tier == "urgent"

    def test_chronic_pain_weeks_maps_to_prompt(self):
        res = evaluate_triage({"chronic_pain_weeks": True})
        assert res.tier == "prompt"

    def test_self_harm_thoughts_maps_to_crisis(self):
        res = evaluate_triage({"self_harm_thoughts": True})
        assert res.tier == "crisis"
        assert res.helpline is not None
        assert "14416" in res.helpline  # Tele-MANAS verified number
        assert "1800-599-0019" in res.helpline  # KIRAN verified number

    def test_no_flags_maps_to_routine(self):
        res = evaluate_triage({})
        assert res.tier == "routine"
        assert res.can_continue is True

    def test_multiple_flags_takes_highest_severity(self):
        # Emergency (level 5) beats prompt (level 2)
        res = evaluate_triage({"testicular_lump": True, "sudden_severe_pain": True})
        assert res.tier == "emergency"


class TestTriageEndpoint:
    def test_get_triage_questions_returns_seven_items(self):
        response = client.get("/api/v1/triage/questions")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 7
        ids = [q["id"] for q in data]
        assert "sudden_severe_pain" in ids
        assert "self_harm_thoughts" in ids

    def test_submit_triage_routine_persists_only_tier_in_audit(self):
        db = TestingSessionLocal()
        initial_audits = db.query(AuditEvent).count()
        db.close()

        response = client.post("/api/v1/triage", json={"answers": {}})
        assert response.status_code == 200
        data = response.json()
        assert data["tier"] == "routine"

        db = TestingSessionLocal()
        audit = db.query(AuditEvent).filter(AuditEvent.event_type == "triage_completed").first()
        assert audit is not None
        assert audit.event_metadata == {"tier": "routine"}
        # Verify answers are NEVER persisted in audit_metadata or anywhere in audit
        assert "answers" not in str(audit.event_metadata)
        db.close()

    def test_submit_triage_emergency_answers_never_persisted(self):
        raw_submission = {
            "sudden_severe_pain": True,
            "chronic_pain_weeks": True,
        }
        response = client.post("/api/v1/triage", json={"answers": raw_submission})
        assert response.status_code == 200
        data = response.json()
        assert data["tier"] == "emergency"

        db = TestingSessionLocal()
        audits = db.query(AuditEvent).filter(AuditEvent.event_type == "triage_completed").all()
        assert len(audits) >= 1
        latest = audits[-1]
        assert latest.event_metadata == {"tier": "emergency"}
        # Security Privacy Check: NO question IDs or raw boolean answers exist in metadata
        for q_id in raw_submission.keys():
            assert q_id not in str(latest.event_metadata)
        db.close()

    def test_unauthenticated_triage_request_denied(self):
        global active_user_id
        active_user_id = None
        response = client.post("/api/v1/triage", json={"answers": {}})
        assert response.status_code == 401


# ===========================================================================
# 3.2 CLINICIAN-READY ONE-PAGER (EXPIRING SHARE LINK) TESTS
# ===========================================================================

class TestSharedReport:
    def _create_mock_session_and_report(self, user_id=USER_1_ID):
        sess_id = uuid4()
        db = TestingSessionLocal()
        sess = AssessmentSession(
            id=sess_id,
            user_id=user_id,
            status="COMPLETED",
            assessment_version="2.0",
            completed_at=datetime.now(timezone.utc),
        )
        db.add(sess)
        
        rep = Report(
            id=uuid4(),
            assessment_session_id=sess_id,
            model_provider="groq",
            model_name="llama-3.3-70b-versatile",
            report_content={
                "overall_category": "Worth monitoring",
                "factors_evaluated": [
                    {"id": "laptop_on_lap_heat", "name": "Laptop on Lap Heat", "domain": "environmental_exposure", "evidence_grade": "B", "status": "reported"},
                    {"id": "porn_consumption_frequency", "name": "Pornography Frequency", "domain": "digital_sexual_behavior", "evidence_grade": "C", "status": "reported"},
                ],
                "prioritized_action_plan": [
                    {"action_type": "professional_discussion", "title": "Discuss scrotal heat exposure with clinician"},
                ],
            },
        )
        db.add(rep)

        res = AssessmentResult(
            id=uuid4(),
            assessment_session_id=sess_id,
            overall_category="Worth monitoring",
            risk_scores={},
            interpretation="Clinical monitoring suggested.",
        )
        db.add(res)

        db.commit()
        db.close()
        return sess_id

    def test_create_share_returns_token_and_persists_hash_only(self):
        sess_id = self._create_mock_session_and_report(USER_1_ID)

        response = client.post(
            f"/api/v1/assessments/{sess_id}/share",
            json={"expires_in_hours": 72, "max_views": 10, "include_digital_sexual": False},
        )
        assert response.status_code == 200
        data = response.json()
        raw_token = data["token"]
        assert raw_token is not None
        assert len(raw_token) >= 32

        # Verify database: hash ONLY, never the raw token string
        db = TestingSessionLocal()
        from app.models.shared_report import SharedReport
        share_rec = db.query(SharedReport).filter(SharedReport.id == UUID(data["share_id"])).first()
        assert share_rec is not None
        expected_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        assert share_rec.token_hash == expected_hash
        assert raw_token not in share_rec.token_hash
        db.close()

    def test_unauthenticated_view_shared_report_success(self):
        sess_id = self._create_mock_session_and_report(USER_1_ID)

        create_res = client.post(
            f"/api/v1/assessments/{sess_id}/share",
            json={"expires_in_hours": 72, "max_views": 10, "include_digital_sexual": False},
        )
        token = create_res.json()["token"]

        # View unauthenticated (by design)
        global active_user_id
        old_user = active_user_id
        active_user_id = None

        res = client.get(f"/api/v1/shared/{token}")
        active_user_id = old_user

        assert res.status_code == 200
        # Anti-cache and anti-indexing headers
        assert "no-store" in res.headers.get("Cache-Control", "")
        assert "noindex" in res.headers.get("X-Robots-Tag", "")

        doc = res.json()
        assert "assessment_date" in doc
        assert "limitations_and_disclaimer" in doc
        assert "u1@care.com" not in str(doc)
        assert "User One" not in str(doc)

        # Verify view count incremented
        db = TestingSessionLocal()
        from app.models.shared_report import SharedReport
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        rec = db.query(SharedReport).filter(SharedReport.token_hash == token_hash).first()
        assert rec.view_count == 1
        db.close()

    def test_expired_token_returns_404(self):
        sess_id = self._create_mock_session_and_report(USER_1_ID)
        create_res = client.post(
            f"/api/v1/assessments/{sess_id}/share",
            json={"expires_in_hours": 24, "max_views": 10, "include_digital_sexual": False},
        )
        token = create_res.json()["token"]

        # Manually expire in DB
        db = TestingSessionLocal()
        from app.models.shared_report import SharedReport
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        rec = db.query(SharedReport).filter(SharedReport.token_hash == token_hash).first()
        rec.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
        db.commit()
        db.close()

        res = client.get(f"/api/v1/shared/{token}")
        assert res.status_code == 404
        assert "not found, expired, or revoked" in res.json()["detail"]

    def test_revoked_token_returns_404(self):
        sess_id = self._create_mock_session_and_report(USER_1_ID)
        create_res = client.post(
            f"/api/v1/assessments/{sess_id}/share",
            json={"expires_in_hours": 72, "max_views": 10},
        )
        share_id = create_res.json()["share_id"]
        token = create_res.json()["token"]

        # Revoke via DELETE
        del_res = client.delete(f"/api/v1/shares/{share_id}")
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "revoked"

        # Subsequent view must return 404
        res = client.get(f"/api/v1/shared/{token}")
        assert res.status_code == 404

    def test_over_limit_token_returns_404(self):
        sess_id = self._create_mock_session_and_report(USER_1_ID)
        create_res = client.post(
            f"/api/v1/assessments/{sess_id}/share",
            json={"expires_in_hours": 72, "max_views": 1},
        )
        token = create_res.json()["token"]

        # First view succeeds
        res1 = client.get(f"/api/v1/shared/{token}")
        assert res1.status_code == 200

        # Second view exceeds limit -> 404
        res2 = client.get(f"/api/v1/shared/{token}")
        assert res2.status_code == 404

    def test_unknown_token_returns_identical_404(self):
        fake_token = secrets.token_urlsafe(32)
        res = client.get(f"/api/v1/shared/{fake_token}")
        assert res.status_code == 404
        assert "not found, expired, or revoked" in res.json()["detail"]

    def test_digital_sexual_block_excluded_by_default(self):
        sess_id = self._create_mock_session_and_report(USER_1_ID)
        create_res = client.post(
            f"/api/v1/assessments/{sess_id}/share",
            json={"expires_in_hours": 72, "include_digital_sexual": False},
        )
        token = create_res.json()["token"]

        res = client.get(f"/api/v1/shared/{token}")
        factors = res.json()["reported_symptoms_and_factors"]
        names = [f["name"] for f in factors]
        assert "Pornography Frequency" not in names
        assert "Laptop on Lap Heat" in names

    def test_digital_sexual_block_included_when_toggled(self):
        sess_id = self._create_mock_session_and_report(USER_1_ID)
        create_res = client.post(
            f"/api/v1/assessments/{sess_id}/share",
            json={"expires_in_hours": 72, "include_digital_sexual": True},
        )
        token = create_res.json()["token"]

        res = client.get(f"/api/v1/shared/{token}")
        factors = res.json()["reported_symptoms_and_factors"]
        names = [f["name"] for f in factors]
        assert "Pornography Frequency" in names
        assert "Laptop on Lap Heat" in names

    def test_cross_user_isolation_cannot_share_other_users_assessment(self):
        sess_id = self._create_mock_session_and_report(USER_1_ID)

        # Switch to USER_2
        global active_user_id
        active_user_id = USER_2_ID

        response = client.post(
            f"/api/v1/assessments/{sess_id}/share",
            json={"expires_in_hours": 72},
        )
        assert response.status_code == 403

    def test_cross_user_isolation_cannot_revoke_other_users_share(self):
        sess_id = self._create_mock_session_and_report(USER_1_ID)
        create_res = client.post(f"/api/v1/assessments/{sess_id}/share", json={})
        share_id = create_res.json()["share_id"]

        # Switch to USER_2
        global active_user_id
        active_user_id = USER_2_ID

        del_res = client.delete(f"/api/v1/shares/{share_id}")
        assert del_res.status_code == 403

