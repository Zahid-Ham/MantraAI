import sys
import os
import time
import urllib.parse
from uuid import uuid4
from datetime import datetime, date, timedelta
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
import sqlalchemy
from sqlalchemy.orm import sessionmaker, Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.config import settings
from app.database import Base, get_db
from app.auth.firebase_auth import get_current_user, require_admin_user
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report
from app.models.companion import CompanionConversation, CompanionMessage
from app.models.health import HealthConnection, HealthDailyMetrics, AdaptiveGoal
from app.models.wellness_plan import WellnessPlan, WellnessActionItem, WellnessActionLog
from app.models.myth_fact import MythFactQueryHistory
from app.models.consent import UserConsent
from app.models.deletion import AccountDeletionRecord
from app.models.audit import AuditEvent
from app.services import user_data_service
from app.schemas.myth_fact import MythFactQueryRequest

# Setup isolated SQLite test database engine
TEST_DB_URL = "sqlite:///./test_privacy.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


TEST_USER_A_ID = uuid4()
TEST_USER_B_ID = uuid4()
current_mock_user_id = TEST_USER_A_ID
current_mock_auth_time = None


def override_get_current_user(db: Session = pytest.importorskip("fastapi").Depends(override_get_db)):
    if not current_mock_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing authentication token.")

    # Check deletion lifecycle status first
    completed_rec = db.query(AccountDeletionRecord).filter(
        AccountDeletionRecord.user_id == current_mock_user_id,
        AccountDeletionRecord.status == "COMPLETED",
    ).first()
    if completed_rec:
        user = User(id=current_mock_user_id, firebase_uid=completed_rec.firebase_uid, email="user@mantraai.test")
        user._is_pending_deletion = True
        return user

    user = db.query(User).filter(User.id == current_mock_user_id).first()
    if not user:
        # Check if user's database records were deleted but Firebase deletion is pending retry
        pending = db.query(AccountDeletionRecord).filter(
            AccountDeletionRecord.user_id == current_mock_user_id,
            AccountDeletionRecord.status == "PENDING_FIREBASE",
        ).first()
        if pending:
            user = User(id=current_mock_user_id, firebase_uid=pending.firebase_uid, email="user@mantraai.test")
            user._is_pending_deletion = True
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found in system.")

    if current_mock_auth_time is not None:
        setattr(user, "auth_time", current_mock_auth_time)
    return user


def override_require_admin_user():
    return User(id=uuid4(), email="admin@mantraai.test", display_name="Admin Test")


@pytest.fixture(autouse=True)
def setup_privacy_test_env():
    global current_mock_user_id, current_mock_auth_time
    current_mock_user_id = TEST_USER_A_ID
    current_mock_auth_time = int(datetime.utcnow().timestamp())  # Fresh auth by default

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[require_admin_user] = override_require_admin_user

    # Clean isolated test database tables before each test
    db = TestingSessionLocal()
    try:
        db.query(Report).delete()
        db.query(AssessmentResult).delete()
        db.query(AssessmentResponse).delete()
        db.query(AssessmentSession).delete()
        db.query(CompanionMessage).delete()
        db.query(CompanionConversation).delete()
        db.query(HealthDailyMetrics).delete()
        db.query(AdaptiveGoal).delete()
        db.query(HealthConnection).delete()
        db.query(WellnessActionLog).delete()
        db.query(WellnessActionItem).delete()
        db.query(WellnessPlan).delete()
        db.query(MythFactQueryHistory).delete()
        db.query(UserConsent).delete()
        db.query(AccountDeletionRecord).delete()
        db.query(AuditEvent).delete()
        db.query(User).delete()

        user_a = User(
            id=TEST_USER_A_ID,
            firebase_uid="firebase_user_a_123",
            email="user_a@mantraai.test",
            display_name="User Alpha",
        )
        user_b = User(
            id=TEST_USER_B_ID,
            firebase_uid="firebase_user_b_456",
            email="user_b@mantraai.test",
            display_name="User Beta",
        )
        db.add_all([user_a, user_b])
        db.commit()
    finally:
        db.close()

    yield

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(require_admin_user, None)


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# Priority 1: Account Deletion Reliability & State Machine Tests
# ---------------------------------------------------------------------------

def test_account_deletion_unauthenticated(client):
    """Unauthenticated delete requests must return 401 Unauthorized."""
    global current_mock_user_id
    current_mock_user_id = None
    res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
    assert res.status_code == 401


def test_account_deletion_invalid_confirmation(client):
    """Requests without exact 'DELETE' confirmation token must be rejected with 422."""
    res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "NO"})
    assert res.status_code == 422


def test_account_deletion_missing_firebase_credentials(client):
    """
    When Firebase Admin credentials are not initialized/configured,
    deletion must abort with 503 Service Unavailable and NEVER delete database records.
    """
    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=False):
        res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res.status_code == 503
        assert "Firebase Authentication service is not initialized" in res.json()["detail"]

    # Verify user record is completely untouched in database
    db = TestingSessionLocal()
    user = db.query(User).filter(User.id == TEST_USER_A_ID).first()
    assert user is not None
    db.close()


def test_account_deletion_complete_graph_success(client):
    """
    Proves atomic transactional wiping of the complete user data graph
    and successful Firebase account deletion.
    """
    db = TestingSessionLocal()
    sess_id = uuid4()
    plan_id = uuid4()
    item_id = uuid4()
    conv_id = uuid4()

    session = AssessmentSession(id=sess_id, user_id=TEST_USER_A_ID, assessment_version="1.0", status="COMPLETED")
    db.add(session)
    db.add(AssessmentResponse(assessment_session_id=sess_id, question_id="age_years", response_value=32))
    db.add(AssessmentResult(assessment_session_id=sess_id, overall_category="Stable", risk_scores={}, interpretation="Normal baseline"))
    db.add(Report(assessment_session_id=sess_id, report_version="1.0", model_provider="groq", model_name="llama3", report_content={}))
    conv = CompanionConversation(id=conv_id, user_id=TEST_USER_A_ID, title="Health Discussion")
    db.add(conv)
    db.add(CompanionMessage(conversation_id=conv_id, role="user", content="Sleep fatigue inquiry"))
    db.add(HealthDailyMetrics(user_id=TEST_USER_A_ID, date=date.today(), sleep_duration_minutes=420, steps=8000, source="health_connect"))
    db.add(AdaptiveGoal(user_id=TEST_USER_A_ID, date=date.today(), goal_type="sleep", title="Sleep Goal", target_value=8.0, unit="hours"))
    db.add(HealthConnection(user_id=TEST_USER_A_ID, provider="mock", status="connected"))
    plan = WellnessPlan(id=plan_id, user_id=TEST_USER_A_ID, title="Active Plan", focus_areas=["sleep"])
    db.add(plan)
    item = WellnessActionItem(id=item_id, plan_id=plan_id, user_id=TEST_USER_A_ID, action_key="act-1", title="Action 1", explanation="Consistent sleep schedule", domain="sleep")
    db.add(item)
    db.add(WellnessActionLog(action_item_id=item_id, user_id=TEST_USER_A_ID, date=date.today(), status="completed"))
    db.add(MythFactQueryHistory(user_id=TEST_USER_A_ID, query_text="Phone radiation fertility", match_type="semantic", classification="FACT", domain="lifestyle", explanation="Thermal proximity effect", review_status="reviewed"))
    db.add(UserConsent(user_id=TEST_USER_A_ID, consent_type="PRIVACY_POLICY", policy_version="1.0", action="ACCEPTED"))
    db.commit()

    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
         patch("app.services.user_data_service.delete_firebase_user", return_value=(True, None)):
        res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "COMPLETED"
        assert data["firebase_account_deleted"] is True
        assert data["records_deleted"]["users"] == 1
        assert data["records_deleted"]["assessment_sessions"] == 1

    # Verify database graph is completely empty
    db.expire_all()
    assert db.query(User).filter(User.id == TEST_USER_A_ID).first() is None
    assert db.query(AssessmentSession).filter(AssessmentSession.user_id == TEST_USER_A_ID).count() == 0
    assert db.query(Report).count() == 0
    assert db.query(CompanionMessage).count() == 0
    assert db.query(HealthDailyMetrics).filter(HealthDailyMetrics.user_id == TEST_USER_A_ID).count() == 0
    assert db.query(WellnessPlan).filter(WellnessPlan.user_id == TEST_USER_A_ID).count() == 0
    assert db.query(UserConsent).filter(UserConsent.user_id == TEST_USER_A_ID).count() == 0
    db.close()


def test_account_deletion_preserves_other_users_and_evidence(client):
    """Deleting User A's data must leave User B's data completely untouched."""
    db = TestingSessionLocal()
    b_sess_id = uuid4()
    db.add(AssessmentSession(id=b_sess_id, user_id=TEST_USER_B_ID, assessment_version="1.0", status="IN_PROGRESS"))
    db.commit()

    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
         patch("app.services.user_data_service.delete_firebase_user", return_value=(True, None)):
        res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res.status_code == 200

    # User B must remain intact
    db.expire_all()
    user_b = db.query(User).filter(User.id == TEST_USER_B_ID).first()
    assert user_b is not None
    assert db.query(AssessmentSession).filter(AssessmentSession.id == b_sess_id).first() is not None
    db.close()


def test_account_deletion_db_failure_rolls_back_and_leaves_firebase_untouched(client):
    """
    CRITICAL SAFETY TEST:
    If database deletion fails, the database transaction must roll back cleanly,
    the deletion record marked FAILED, and Firebase must NEVER be deleted.
    This fixes the catastrophic failure case where Firebase deletion succeeds while
    database fails, trapping inaccessible personal health records.
    """
    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
         patch("app.services.user_data_service.delete_user_data_graph", side_effect=RuntimeError("Simulated DB Disk Failure")), \
         patch("app.services.user_data_service.delete_firebase_user") as mock_fb:
        res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res.status_code == 500
        assert "Database deletion encountered an unexpected error" in res.json()["detail"]
        mock_fb.assert_not_called()  # Firebase MUST NOT be touched!

    # Verify user record was preserved by rollback
    db = TestingSessionLocal()
    user = db.query(User).filter(User.id == TEST_USER_A_ID).first()
    assert user is not None
    record = db.query(AccountDeletionRecord).filter(AccountDeletionRecord.user_id == TEST_USER_A_ID).first()
    assert record.status == "FAILED"
    db.close()


def test_account_deletion_firebase_failure_after_db_wipe_and_retry(client):
    """
    When PostgreSQL is wiped but Firebase deletion encounters a service error:
    1. Returns PENDING_FIREBASE with truthful guidance.
    2. Retry succeeds and marks COMPLETED idempotently.
    """
    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
         patch("app.services.user_data_service.delete_firebase_user", return_value=(False, "Firebase 503 Timeout")):
        res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "PENDING_FIREBASE"
        assert data["firebase_account_deleted"] is False

    # Retry: second call should retry Firebase deletion and transition to COMPLETED
    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
         patch("app.services.user_data_service.delete_firebase_user", return_value=(True, None)):
        res_retry = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res_retry.status_code == 200
        data_retry = res_retry.json()
        assert data_retry["status"] == "COMPLETED"
        assert data_retry["firebase_account_deleted"] is True


def test_account_deletion_end_to_end_retry_after_session_loss(client):
    """
    Complete end-to-end distributed retry sequence:
    1. Client initiates account deletion.
    2. Database deletion commits; Firebase deletion fails (e.g. network timeout).
    3. Status is recorded as PENDING_FIREBASE. Original user row in DB is deleted.
    4. Client session is lost (app restarts / network resets).
    5. Client reconnects with valid Firebase ID token.
    6. System locates the existing deletion record for the Firebase UID.
    7. Client retries deletion.
    8. Firebase deletion succeeds -> status reaches COMPLETED.
    9. Confirms no duplicate or stray User record is left behind in the database.
    """
    db = TestingSessionLocal()
    user_a = db.query(User).filter(User.id == TEST_USER_A_ID).first()
    fb_uid = user_a.firebase_uid
    db.close()

    # Step 1: Initial call - DB commits, Firebase fails
    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
         patch("app.services.user_data_service.delete_firebase_user", return_value=(False, "Firebase 503 Service Unavailable")):
        res1 = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res1.status_code == 200
        assert res1.json()["status"] == "PENDING_FIREBASE"

    # Verify original user row is deleted from database
    db = TestingSessionLocal()
    assert db.query(User).filter(User.firebase_uid == fb_uid).first() is None
    rec = db.query(AccountDeletionRecord).filter(AccountDeletionRecord.firebase_uid == fb_uid).first()
    assert rec.status == "PENDING_FIREBASE"
    db.close()

    # Step 2: Client retries deletion using authenticated identity
    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
         patch("app.services.user_data_service.delete_firebase_user", return_value=(True, None)):
        res2 = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["status"] == "COMPLETED"
        assert data2["firebase_account_deleted"] is True

    # Verify deletion record is COMPLETED and no stray user record was created
    db = TestingSessionLocal()
    rec_after = db.query(AccountDeletionRecord).filter(AccountDeletionRecord.firebase_uid == fb_uid).first()
    assert rec_after.status == "COMPLETED"
    assert db.query(User).filter(User.firebase_uid == fb_uid).first() is None
    db.close()


def test_account_deletion_stale_pending_timeout_allows_fresh_attempt(client):
    """
    A deletion record stuck in PENDING for > 60 seconds (interrupted / killed request)
    must be marked FAILED and allow a fresh deletion request to proceed.
    """
    db = TestingSessionLocal()
    user_a = db.query(User).filter(User.id == TEST_USER_A_ID).first()
    stale_record = AccountDeletionRecord(
        firebase_uid=user_a.firebase_uid,
        user_id=user_a.id,
        status="PENDING",
        initiated_at=datetime.utcnow() - timedelta(seconds=120),  # 2 minutes ago
    )
    db.add(stale_record)
    db.commit()
    db.close()

    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
         patch("app.services.user_data_service.delete_firebase_user", return_value=(True, None)):
        res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res.status_code == 200
        assert res.json()["status"] == "COMPLETED"

    db = TestingSessionLocal()
    refreshed_stale = db.query(AccountDeletionRecord).filter(AccountDeletionRecord.id == stale_record.id).first()
    assert refreshed_stale.status == "FAILED"
    db.close()


def test_account_deletion_duplicate_in_progress_request(client):
    """Concurrent requests while deletion is PENDING must return 409 Conflict."""
    db = TestingSessionLocal()
    user_a = db.query(User).filter(User.id == TEST_USER_A_ID).first()
    record = AccountDeletionRecord(
        firebase_uid=user_a.firebase_uid,
        user_id=user_a.id,
        status="PENDING",
        initiated_at=datetime.utcnow() - timedelta(seconds=10),
    )
    db.add(record)
    db.commit()
    db.close()

    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True):
        res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res.status_code == 409
        assert "already in progress" in res.json()["detail"]


def test_account_deletion_repeated_request_idempotent(client):
    """Repeated request after deletion has COMPLETED returns 200 COMPLETED idempotently."""
    db = TestingSessionLocal()
    user_a = db.query(User).filter(User.id == TEST_USER_A_ID).first()
    record = AccountDeletionRecord(
        firebase_uid=user_a.firebase_uid,
        user_id=user_a.id,
        status="COMPLETED",
    )
    db.add(record)
    db.commit()
    db.close()

    with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True):
        res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
        assert res.status_code == 200
        assert res.json()["status"] == "COMPLETED"


def test_account_deletion_requires_recent_authentication(client):
    """Irreversible account deletion requires recent authentication within max window (900s)."""
    global current_mock_auth_time
    current_mock_auth_time = int(datetime.utcnow().timestamp()) - 1200  # 20 minutes ago (stale!)

    res = client.request("DELETE", "/api/v1/auth/account", json={"confirmation": "DELETE"})
    assert res.status_code == 401
    assert "Recent authentication required" in res.json()["detail"]


def test_account_deletion_admin_reconciliation_endpoint(client):
    """
    Administrative recovery endpoint POST /api/v1/auth/account/reconcile retries
    pending PENDING_FIREBASE account records and finalizes them to COMPLETED.
    """
    db = TestingSessionLocal()
    rec = AccountDeletionRecord(
        firebase_uid="orphan_fb_uid_999",
        user_id=uuid4(),
        status="PENDING_FIREBASE",
        retry_count=1,
    )
    db.add(rec)
    db.commit()
    db.close()

    with patch("app.services.user_data_service.delete_firebase_user", return_value=(True, None)):
        res = client.post("/api/v1/auth/account/reconcile")
        assert res.status_code == 200
        data = res.json()
        assert data["reconciled"] == 1
        assert data["failed"] == 0

    db = TestingSessionLocal()
    updated = db.query(AccountDeletionRecord).filter(AccountDeletionRecord.firebase_uid == "orphan_fb_uid_999").first()
    assert updated.status == "COMPLETED"
    db.close()


# ---------------------------------------------------------------------------
# Priority 2: Server-Side Consent Enforcement & AI Protection Tests
# ---------------------------------------------------------------------------

def test_consent_record_creation_and_versioning(client):
    """Consent decision can be recorded, versioned, and audited."""
    payload = {
        "consent_type": "PRIVACY_POLICY",
        "policy_version": "1.0",
        "action": "ACCEPTED",
    }
    res = client.post("/api/v1/auth/consent", json=payload)
    assert res.status_code == 200
    assert res.json()["action"] == "ACCEPTED"

    # Query consent history
    res_list = client.get("/api/v1/auth/consent")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1


def test_consent_enforcement_blocked_when_no_consent(client):
    """Server-side guard: AI Companion request must return 403 Forbidden when user has no consent."""
    res = client.post("/api/v1/companion/chat", json={"message": "Can you assess my testosterone?"})
    assert res.status_code == 403
    assert res.json()["detail"]["error"] == "CONSENT_REQUIRED"


def test_consent_enforcement_allowed_when_consent_granted(client):
    """When valid consent is recorded for the current notice version, operation succeeds."""
    client.post("/api/v1/auth/consent", json={
        "consent_type": "THIRD_PARTY_AI_ANALYSIS",
        "policy_version": "1.0",
        "action": "ACCEPTED",
    })
    res = client.post("/api/v1/companion/chat", json={"message": "What lifestyle factors affect sperm health?"})
    assert res.status_code == 200


def test_consent_enforcement_blocked_when_consent_revoked(client):
    """
    CRITICAL CONSENT TEST:
    A user who previously ACCEPTED and subsequently REVOKED consent must be blocked with 403.
    The system must never treat an older ACCEPTED record as current consent.
    """
    # 1. Accept
    client.post("/api/v1/auth/consent", json={
        "consent_type": "THIRD_PARTY_AI_ANALYSIS",
        "policy_version": "1.0",
        "action": "ACCEPTED",
    })
    time.sleep(0.01)
    # 2. Revoke
    client.post("/api/v1/auth/consent", json={
        "consent_type": "THIRD_PARTY_AI_ANALYSIS",
        "policy_version": "1.0",
        "action": "REVOKED",
    })

    # 3. Attempt request -> must be rejected with 403!
    res = client.post("/api/v1/companion/chat", json={"message": "Test inquiry post revocation"})
    assert res.status_code == 403
    assert res.json()["detail"]["error"] == "CONSENT_REQUIRED"


def test_consent_enforcement_blocked_when_notice_version_updated(client):
    """
    When policy version is bumped (e.g. from 1.0 to 2.0), user who only consented to 1.0
    must be blocked until consenting to the updated version.
    """
    client.post("/api/v1/auth/consent", json={
        "consent_type": "THIRD_PARTY_AI_ANALYSIS",
        "policy_version": "0.9",  # Outdated version!
        "action": "ACCEPTED",
    })

    res = client.post("/api/v1/companion/chat", json={"message": "Test with old policy version"})
    assert res.status_code == 403
    assert res.json()["detail"]["error"] == "CONSENT_REQUIRED"


def test_ai_call_strictly_prevented_without_explicit_ai_consent(client):
    """
    CRITICAL THIRD-PARTY AI TEST:
    Proves that generic PRIVACY_POLICY consent CANNOT substitute for explicit
    THIRD_PARTY_AI_ANALYSIS consent.
    Proves that missing or revoked consent strictly PREVENTS outbound Groq requests.
    """
    # Case A: User has only generic PRIVACY_POLICY consent
    client.post("/api/v1/auth/consent", json={
        "consent_type": "PRIVACY_POLICY",
        "policy_version": "1.0",
        "action": "ACCEPTED",
    })

    with patch("app.services.report_generator.execute_groq_request") as mock_groq:
        res = client.post("/api/v1/companion/chat", json={"message": "Can you check my fertility factors?"})
        assert res.status_code == 403
        assert res.json()["detail"]["error"] == "CONSENT_REQUIRED"
        mock_groq.assert_not_called()  # Groq was NEVER called!

    # Case B: User accepts, then revokes THIRD_PARTY_AI_ANALYSIS
    client.post("/api/v1/auth/consent", json={
        "consent_type": "THIRD_PARTY_AI_ANALYSIS",
        "policy_version": "1.0",
        "action": "ACCEPTED",
    })
    time.sleep(0.01)
    client.post("/api/v1/auth/consent", json={
        "consent_type": "THIRD_PARTY_AI_ANALYSIS",
        "policy_version": "1.0",
        "action": "REVOKED",
    })

    with patch("app.services.report_generator.execute_groq_request") as mock_groq:
        res_revoked = client.post("/api/v1/companion/chat", json={"message": "Checking after revocation"})
        assert res_revoked.status_code == 403
        mock_groq.assert_not_called()  # Groq was NEVER called!

    # Case C: Explicit active THIRD_PARTY_AI_ANALYSIS consent granted
    time.sleep(0.01)
    client.post("/api/v1/auth/consent", json={
        "consent_type": "THIRD_PARTY_AI_ANALYSIS",
        "policy_version": "1.0",
        "action": "ACCEPTED",
    })

    companion_payload = '{"answer": "Grounded AI response", "cited_evidence_ids": [], "evidence_sufficiency": "sufficient", "domain": "general_health", "suggested_followups": []}'
    with patch("app.services.companion_service.settings.GROQ_API_KEY", "gsk_mock_test_key"), \
         patch("app.services.companion_service.execute_groq_request", return_value=companion_payload) as mock_groq:
        res_ok = client.post("/api/v1/companion/chat", json={"message": "Checking with active consent"})
        assert res_ok.status_code == 200
        mock_groq.assert_called()


def test_assessment_report_generation_bypasses_groq_when_ai_consent_missing(client):
    """
    When completing an assessment:
    1. If user lacks HEALTH_DATA_PROCESSING consent -> 403 Forbidden.
    2. If user holds HEALTH_DATA_PROCESSING consent but NOT THIRD_PARTY_AI_ANALYSIS,
       the assessment completes with a deterministic guideline report and NEVER calls Groq.
    """
    db = TestingSessionLocal()
    sess_id = uuid4()
    db.add(AssessmentSession(id=sess_id, user_id=TEST_USER_A_ID, assessment_version="1.0", status="IN_PROGRESS"))
    db.add(AssessmentResponse(assessment_session_id=sess_id, question_id="lifestyle_sleep", response_value="7"))
    db.commit()
    db.close()

    # Step 1: No consent -> 403 Forbidden
    res_no_consent = client.post(f"/api/v1/assessments/{sess_id}/complete")
    assert res_no_consent.status_code == 403

    # Step 2: Grant HEALTH_DATA_PROCESSING only (NO AI consent)
    client.post("/api/v1/auth/consent", json={
        "consent_type": "HEALTH_DATA_PROCESSING",
        "policy_version": "1.0",
        "action": "ACCEPTED",
    })

    with patch("app.services.report_generator.execute_groq_request") as mock_groq:
        res_completed = client.post(f"/api/v1/assessments/{sess_id}/complete")
        assert res_completed.status_code == 200
        mock_groq.assert_not_called()  # Groq was NEVER called!

    # Verify report was stored with deterministic fallback provider
    db = TestingSessionLocal()
    rep = db.query(Report).filter(Report.assessment_session_id == sess_id).first()
    assert rep is not None
    assert rep.model_provider in ("deterministic_fallback", "system_fallback")
    db.close()


def test_myth_fact_bypasses_groq_when_ai_consent_missing_or_revoked(client):
    """
    Authenticated user querying Myth vs Fact without THIRD_PARTY_AI_ANALYSIS consent
    receives deterministic guideline matching and their query is NEVER sent to Groq.
    """
    # User only has PRIVACY_POLICY consent, NO third-party AI consent
    client.post("/api/v1/auth/consent", json={
        "consent_type": "PRIVACY_POLICY",
        "policy_version": "1.0",
        "action": "ACCEPTED",
    })

    with patch("app.services.report_generator.execute_groq_request") as mock_groq:
        res = client.post(
            "/api/v1/myth-fact/query",
            json={"query": "Does cold water exposure directly optimize male hormones?"},
        )
        assert res.status_code == 200
        mock_groq.assert_not_called()  # Groq was NEVER called!


def test_wellness_plan_requires_health_data_processing_consent(client):
    """
    Generating a personalized wellness plan processes health data and requires
    server-side HEALTH_DATA_PROCESSING consent.
    """
    # 1. No consent -> 403 Forbidden
    res_no_consent = client.post("/api/v1/wellness-plan/generate")
    assert res_no_consent.status_code == 403

    # 2. Grant HEALTH_DATA_PROCESSING -> 200 OK
    client.post("/api/v1/auth/consent", json={
        "consent_type": "HEALTH_DATA_PROCESSING",
        "policy_version": "1.0",
        "action": "ACCEPTED",
    })
    res_ok = client.post("/api/v1/wellness-plan/generate")
    assert res_ok.status_code == 200
    assert res_ok.json()["title"] is not None


# ---------------------------------------------------------------------------
# Priority 3: Individual Assessment Deletion and Data Export Tests
# ---------------------------------------------------------------------------

def test_individual_assessment_deletion(client):
    """Deleting an individual assessment removes session, responses, results, and reports."""
    db = TestingSessionLocal()
    sess_id = uuid4()
    db.add(AssessmentSession(id=sess_id, user_id=TEST_USER_A_ID, assessment_version="1.0", status="COMPLETED"))
    db.add(AssessmentResponse(assessment_session_id=sess_id, question_id="smoking", response_value="never"))
    db.add(AssessmentResult(assessment_session_id=sess_id, overall_category="Stable", risk_scores={}, interpretation="Normal baseline"))
    db.add(Report(assessment_session_id=sess_id, report_version="1.0", model_provider="groq", model_name="llama3", report_content={}))
    db.commit()
    db.close()

    res = client.delete(f"/api/v1/assessments/{sess_id}")
    assert res.status_code == 200

    db = TestingSessionLocal()
    assert db.query(AssessmentSession).filter(AssessmentSession.id == sess_id).first() is None
    assert db.query(AssessmentResponse).filter(AssessmentResponse.assessment_session_id == sess_id).count() == 0
    assert db.query(Report).filter(Report.assessment_session_id == sess_id).count() == 0
    db.close()


def test_individual_assessment_deletion_cross_user_forbidden(client):
    """User A attempting to delete User B's assessment must receive 403/404."""
    db = TestingSessionLocal()
    b_sess_id = uuid4()
    db.add(AssessmentSession(id=b_sess_id, user_id=TEST_USER_B_ID, assessment_version="1.0", status="IN_PROGRESS"))
    db.commit()
    db.close()

    res = client.delete(f"/api/v1/assessments/{b_sess_id}")
    assert res.status_code in (403, 404)


def test_portable_data_export_authorized_and_complete(client):
    """
    Portable data export returns complete user records strictly scoped to requesting user
    with strict no-cache and private security headers.
    """
    db = TestingSessionLocal()
    db.add(UserConsent(user_id=TEST_USER_A_ID, consent_type="PRIVACY_POLICY", policy_version="1.0", action="ACCEPTED"))
    conv_id = uuid4()
    db.add(CompanionConversation(id=conv_id, user_id=TEST_USER_A_ID, title="Export Chat"))
    db.add(CompanionMessage(conversation_id=conv_id, role="user", content="Export message content"))
    db.commit()
    db.close()

    res = client.get("/api/v1/auth/export")
    assert res.status_code == 200
    assert "attachment;" in res.headers.get("content-disposition", "")
    assert "no-store" in res.headers.get("cache-control", "")
    assert "private" in res.headers.get("cache-control", "")

    data = res.json()
    assert data["export_metadata"]["format"] == "JSON"
    assert data["user_profile"]["id"] == str(TEST_USER_A_ID)
    assert len(data["consent_history"]) >= 1
    assert len(data["companion_conversations"]) >= 1


# ---------------------------------------------------------------------------
# Priority 5: Real PostgreSQL-Backed Integration Tests
# ---------------------------------------------------------------------------

def get_safe_test_postgres_session():
    """
    Strict safety guard for live PostgreSQL tests:
    1. Reads connection settings strictly from environment variables (no hardcoded passwords).
    2. Strictly requires database name to contain 'test' (e.g. 'mantraai_test').
    3. Refuses to execute against the production or standard development database.
    4. Returns an active SQLAlchemy session bound to the verified test database.
    """
    raw_base = os.environ.get("POSTGRES_TEST_DATABASE_URL") or os.environ.get("TEST_DATABASE_URL")
    if not raw_base:
        # Derive test database from configured DATABASE_URL by switching to 'mantraai_test'
        base_url = settings.DATABASE_URL
        if base_url and "/mantraai" in base_url:
            raw_base = base_url.replace("/mantraai", "/mantraai_test")

    if not raw_base:
        pytest.skip("No PostgreSQL test database URL configured.")

    parsed = urllib.parse.urlparse(raw_base)
    db_name = parsed.path.lstrip("/").lower()

    if "test" not in db_name:
        raise RuntimeError(
            f"SAFETY ABORT: Refusing to execute destructive test against database '{db_name}'. "
            "Designated test database must explicitly include 'test' in its name."
        )

    # Must NOT match development / production database
    prod_parsed = urllib.parse.urlparse(settings.DATABASE_URL)
    if db_name == prod_parsed.path.lstrip("/").lower():
        raise RuntimeError(f"SAFETY ABORT: Test database '{db_name}' matches DATABASE_URL!")

    try:
        engine = create_engine(raw_base)
        SessionMaker = sessionmaker(bind=engine, autocommit=False, autoflush=False)
        session = SessionMaker()
        # Verify connection
        session.execute(sqlalchemy.text("SELECT 1"))
        return session
    except Exception as e:
        pytest.skip(f"Could not connect to designated test PostgreSQL database: {str(e)}")


def test_real_postgresql_critical_deletion_path():
    """
    Live PostgreSQL Integration Test:
    Connects to the designated 'mantraai_test' PostgreSQL database to verify foreign-key
    cascades, transaction rollback, and atomic data wiping on real PostgreSQL.
    """
    pg_db = get_safe_test_postgres_session()
    test_pg_user_id = uuid4()
    test_pg_user = User(
        id=test_pg_user_id,
        firebase_uid=f"pg_test_{str(test_pg_user_id)[:8]}",
        email="pg_test@mantraai.health",
        display_name="PG Integration Test User",
    )
    pg_db.add(test_pg_user)
    pg_db.commit()

    sess_id = uuid4()
    conv_id = uuid4()
    plan_id = uuid4()
    item_id = uuid4()

    try:
        # Seed records on real PostgreSQL
        pg_db.add(AssessmentSession(id=sess_id, user_id=test_pg_user_id, assessment_version="1.0", status="COMPLETED"))
        pg_db.add(AssessmentResponse(assessment_session_id=sess_id, question_id="diet", response_value="balanced"))
        pg_db.add(AssessmentResult(assessment_session_id=sess_id, overall_category="Stable", risk_scores={}, interpretation="Normal baseline"))
        pg_db.add(Report(assessment_session_id=sess_id, report_version="1.0", model_provider="groq", model_name="llama3", report_content={}))
        pg_db.add(CompanionConversation(id=conv_id, user_id=test_pg_user_id, title="PG Chat"))
        pg_db.add(CompanionMessage(conversation_id=conv_id, role="user", content="PG Query"))
        pg_db.add(HealthDailyMetrics(user_id=test_pg_user_id, date=date.today(), steps=10000, sleep_duration_minutes=480, source="health_connect"))
        pg_db.add(AdaptiveGoal(user_id=test_pg_user_id, date=date.today(), goal_type="steps", title="Walk", target_value=10000, unit="steps"))
        plan = WellnessPlan(id=plan_id, user_id=test_pg_user_id, title="PG Plan", focus_areas=["sleep"])
        pg_db.add(plan)
        item = WellnessActionItem(id=item_id, plan_id=plan_id, user_id=test_pg_user_id, action_key="act-pg", title="PG Act", explanation="Consistent sleep schedule", domain="sleep")
        pg_db.add(item)
        pg_db.add(WellnessActionLog(action_item_id=item_id, user_id=test_pg_user_id, date=date.today(), status="completed"))
        pg_db.add(UserConsent(user_id=test_pg_user_id, consent_type="PRIVACY_POLICY", policy_version="1.0", action="ACCEPTED"))
        pg_db.commit()

        # Execute complete user data graph deletion on PostgreSQL
        counts = user_data_service.delete_user_data_graph(pg_db, test_pg_user)
        assert counts["users"] == 1
        assert counts["assessment_sessions"] == 1
        assert counts["reports"] == 1
        assert counts["companion_messages"] == 1
        assert counts["wellness_plans"] == 1
        assert counts["health_daily_metrics"] == 1

        # Verify PostgreSQL database is completely wiped for this user
        pg_db.expire_all()
        assert pg_db.query(User).filter(User.id == test_pg_user_id).first() is None
        assert pg_db.query(AssessmentSession).filter(AssessmentSession.id == sess_id).first() is None
        assert pg_db.query(Report).filter(Report.assessment_session_id == sess_id).first() is None
        assert pg_db.query(CompanionMessage).filter(CompanionMessage.conversation_id == conv_id).first() is None
        assert pg_db.query(WellnessPlan).filter(WellnessPlan.id == plan_id).first() is None

    finally:
        # Guarantee cleanup even on assertion failure
        try:
            pg_db.query(User).filter(User.id == test_pg_user_id).delete()
            pg_db.commit()
        except Exception:
            pass
        pg_db.close()


def test_real_postgresql_consent_timeline():
    """
    Live PostgreSQL Consent Timeline Test:
    Tests rapid ACCEPTED then REVOKED events, policy version bumps, and confirms
    the latest applicable decision wins deterministically on real PostgreSQL.
    """
    pg_db = get_safe_test_postgres_session()
    test_pg_user_id = uuid4()
    test_pg_user = User(
        id=test_pg_user_id,
        firebase_uid=f"pg_consent_{str(test_pg_user_id)[:8]}",
        email="pg_consent@mantraai.health",
        display_name="PG Consent User",
    )
    pg_db.add(test_pg_user)
    pg_db.commit()

    try:
        # 1. Rapid Accept then Revoke
        user_data_service.record_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", policy_version="1.0", action="ACCEPTED")
        time.sleep(0.005)
        user_data_service.record_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", policy_version="1.0", action="REVOKED")

        # Confirm revoked wins deterministically
        assert user_data_service.has_active_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", "1.0") is False

        # 2. Re-accept
        time.sleep(0.005)
        user_data_service.record_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", policy_version="1.0", action="ACCEPTED")
        assert user_data_service.has_active_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", "1.0") is True

        # 3. Policy version bump to 2.0 (user has only accepted 1.0)
        assert user_data_service.has_active_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", "2.0") is False

        # 4. Accept 2.0
        time.sleep(0.005)
        user_data_service.record_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", policy_version="2.0", action="ACCEPTED")
        assert user_data_service.has_active_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", "2.0") is True

        # 5. Revoke 2.0 -> Must be False, historical 1.0 acceptance must not revive consent
        time.sleep(0.005)
        user_data_service.record_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", policy_version="2.0", action="REVOKED")
        assert user_data_service.has_active_consent(pg_db, test_pg_user, "THIRD_PARTY_AI_ANALYSIS", "2.0") is False

    finally:
        pg_db.query(UserConsent).filter(UserConsent.user_id == test_pg_user_id).delete()
        pg_db.query(User).filter(User.id == test_pg_user_id).delete()
        pg_db.commit()
        pg_db.close()


def test_real_postgresql_account_deletion_retry_lifecycle():
    """
    Live PostgreSQL Distributed Deletion Lifecycle Test:
    Tests the exact sequence on real PostgreSQL:
    1. User's database data is wiped in an isolated transaction.
    2. Firebase deletion fails -> recorded as PENDING_FIREBASE.
    3. User row is deleted from PostgreSQL 'users' table.
    4. Client retries with Firebase UID identity.
    5. Retry locates the existing record and transitions to COMPLETED.
    6. Confirms no orphan user row is left in real PostgreSQL.
    """
    pg_db = get_safe_test_postgres_session()
    test_pg_user_id = uuid4()
    fb_uid = f"pg_retry_{str(test_pg_user_id)[:8]}"
    test_pg_user = User(
        id=test_pg_user_id,
        firebase_uid=fb_uid,
        email="pg_retry@mantraai.health",
        display_name="PG Retry Test User",
    )
    pg_db.add(test_pg_user)
    pg_db.commit()

    try:
        # Step A: Initiate deletion with simulated Firebase failure
        with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
             patch("app.services.user_data_service.delete_firebase_user", return_value=(False, "Firebase 503 Timeout")):
            result1 = user_data_service.execute_complete_user_deletion(
                db=pg_db,
                user=test_pg_user,
                require_recent_auth=False,
            )
            assert result1["status"] == "PENDING_FIREBASE"
            assert result1["firebase_account_deleted"] is False

        # Verify PostgreSQL user row is wiped
        pg_db.expire_all()
        assert pg_db.query(User).filter(User.firebase_uid == fb_uid).first() is None
        record = pg_db.query(AccountDeletionRecord).filter(AccountDeletionRecord.firebase_uid == fb_uid).first()
        assert record is not None
        assert record.status == "PENDING_FIREBASE"

        # Step B: Client retries after session loss using reconstructed transient user
        transient_user = User(
            id=record.user_id,
            firebase_uid=fb_uid,
            email="pg_retry@mantraai.health",
        )
        transient_user._is_pending_deletion = True

        with patch("app.services.user_data_service.is_firebase_admin_configured", return_value=True), \
             patch("app.services.user_data_service.delete_firebase_user", return_value=(True, None)):
            result2 = user_data_service.execute_complete_user_deletion(
                db=pg_db,
                user=transient_user,
                require_recent_auth=False,
            )
            assert result2["status"] == "COMPLETED"
            assert result2["firebase_account_deleted"] is True

        # Verify record is COMPLETED and no stray row was inserted in PostgreSQL
        pg_db.expire_all()
        rec_final = pg_db.query(AccountDeletionRecord).filter(AccountDeletionRecord.firebase_uid == fb_uid).first()
        assert rec_final.status == "COMPLETED"
        assert pg_db.query(User).filter(User.firebase_uid == fb_uid).first() is None

    finally:
        pg_db.query(AccountDeletionRecord).filter(AccountDeletionRecord.firebase_uid == fb_uid).delete()
        pg_db.query(User).filter(User.firebase_uid == fb_uid).delete()
        pg_db.commit()
        pg_db.close()
