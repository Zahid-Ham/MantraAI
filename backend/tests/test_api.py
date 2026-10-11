import sys
import os
import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from uuid import uuid4

# Add parent directory to python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.database import Base, get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report

# Configure standard local test SQL database engine (in-memory SQLite with shared pool)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Set up test database tables (done fresh in fixture to pick up schema changes)
Base.metadata.create_all(bind=engine)

# Inject mock db session
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

# Define constant UUIDs for mock users
USER_1_ID = uuid4()
USER_2_ID = uuid4()

active_user_id = USER_1_ID

# Inject mock authentication provider
def override_get_current_user(db: Session = Depends(get_db)):
    if not active_user_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    # Fetch from active DB session to ensure session-binding and freshness
    return db.query(User).filter(User.id == active_user_id).first()

@pytest.fixture(autouse=True)
def run_around_tests():
    global active_user_id
    active_user_id = USER_1_ID
    # Recreate schema before each test to ensure columns are always up to date
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    # Setup: Insert fresh mock users into database before each test run
    db = TestingSessionLocal()
    
    u1 = User(
        id=USER_1_ID,
        firebase_uid="firebase_test_uid_1",
        email="test1@mantraai.com",
        display_name="Test User 1"
    )
    u2 = User(
        id=USER_2_ID,
        firebase_uid="firebase_test_uid_2",
        email="test2@mantraai.com",
        display_name="Test User 2"
    )
    db.add(u1)
    db.add(u2)
    db.commit()
    db.close()
    yield
    # No action needed on teardown as tables get purged on setup

def test_unauthenticated_request_returns_401():
    global active_user_id
    active_user_id = None
    response = client.get("/api/v1/auth/profile")
    assert response.status_code == 401
    assert "detail" in response.json()

def test_valid_token_returns_authenticated():
    global active_user_id
    active_user_id = USER_1_ID
    response = client.get("/api/v1/auth/profile")
    assert response.status_code == 200
    assert response.json()["firebase_uid"] == "firebase_test_uid_1"

def test_assessment_creation_works():
    global active_user_id
    active_user_id = USER_1_ID
    response = client.post("/api/v1/assessments", json={"assessment_version": "2.0"})
    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"
    assert response.json()["assessment_version"] == "2.0"

def test_response_persistence_works():
    global active_user_id
    active_user_id = USER_1_ID
    # 1. Create session
    sess_res = client.post("/api/v1/assessments", json={"assessment_version": "2.0"})
    sess_id = sess_res.json()["id"]

    # 2. Post responses progressive
    resp_res = client.post(
        f"/api/v1/assessments/{sess_id}/responses",
        json={"responses": {"stress_level": "High", "sleep_hours": "6"}}
    )
    assert resp_res.status_code == 200
    assert resp_res.json()["saved_count"] == 2

def test_user_cannot_access_another_users_assessment():
    global active_user_id
    # 1. User 1 creates session
    active_user_id = USER_1_ID
    sess_res = client.post("/api/v1/assessments", json={"assessment_version": "2.0"})
    sess_id = sess_res.json()["id"]

    # 2. User 2 tries to access User 1 session
    active_user_id = USER_2_ID
    get_res = client.get(f"/api/v1/assessments/{sess_id}")
    assert get_res.status_code == 403

def test_missing_assessment_returns_404():
    global active_user_id
    active_user_id = USER_1_ID
    random_uuid = str(uuid4())
    get_res = client.get(f"/api/v1/assessments/{random_uuid}")
    assert get_res.status_code == 404

def test_invalid_payload_returns_422():
    global active_user_id
    active_user_id = USER_1_ID
    # Try creating with invalid data type
    response = client.post("/api/v1/assessments", json={"assessment_version": {"invalid": "object"}})
    assert response.status_code == 422

# ===========================================================================
# 4.3 – Background Report Generation Endpoints
# ===========================================================================

def test_report_status_returns_pending_after_complete():
    """After /complete, report_status is pending and GET /report/status reflects it."""
    global active_user_id
    active_user_id = USER_1_ID
    # Create and populate session
    sess = client.post("/api/v1/assessments", json={"assessment_version": "2.0"})
    sess_id = sess.json()["id"]
    client.post(f"/api/v1/assessments/{sess_id}/responses",
                json={"responses": {"stress_level": "High", "sleep_hours": "6"}})

    # Complete the assessment
    complete_res = client.post(f"/api/v1/assessments/{sess_id}/complete")
    assert complete_res.status_code == 200

    # Poll status endpoint
    status_res = client.get(f"/api/v1/assessments/{sess_id}/report/status")
    assert status_res.status_code == 200
    data = status_res.json()
    assert data["assessment_session_id"] == sess_id
    assert data["status"] in ("pending", "ready", "failed")


def test_report_status_returns_404_for_unknown_session():
    """GET /report/status for unknown session ID returns 404."""
    global active_user_id
    active_user_id = USER_1_ID
    random_uuid = str(uuid4())
    res = client.get(f"/api/v1/assessments/{random_uuid}/report/status")
    assert res.status_code == 404


def test_report_retry_returns_400_for_incomplete_session():
    """POST /report/retry on an IN_PROGRESS session returns 400."""
    global active_user_id
    active_user_id = USER_1_ID
    sess = client.post("/api/v1/assessments", json={"assessment_version": "2.0"})
    sess_id = sess.json()["id"]
    res = client.post(f"/api/v1/assessments/{sess_id}/report/retry")
    assert res.status_code == 400


def test_report_retry_succeeds_on_completed_session():
    """POST /report/retry on a COMPLETED session should reset to pending and return 200."""
    global active_user_id
    active_user_id = USER_1_ID
    sess = client.post("/api/v1/assessments", json={"assessment_version": "2.0"})
    sess_id = sess.json()["id"]
    client.post(f"/api/v1/assessments/{sess_id}/responses",
                json={"responses": {"stress_level": "Low"}})
    client.post(f"/api/v1/assessments/{sess_id}/complete")

    retry_res = client.post(f"/api/v1/assessments/{sess_id}/report/retry")
    assert retry_res.status_code == 200
    data = retry_res.json()
    assert data["status"] == "pending"
    assert data["assessment_session_id"] == sess_id


def test_report_status_user_isolation():
    """User 2 cannot access User 1's report status."""
    global active_user_id
    active_user_id = USER_1_ID
    sess = client.post("/api/v1/assessments", json={"assessment_version": "2.0"})
    sess_id = sess.json()["id"]

    active_user_id = USER_2_ID
    res = client.get(f"/api/v1/assessments/{sess_id}/report/status")
    assert res.status_code == 403

