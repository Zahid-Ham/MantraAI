import sys
import os
import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from uuid import uuid4

# Add parent directory to python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.database import Base, get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report

# Configure standard local test SQL database engine (SQLite memory fallback)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Set up test database tables
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

app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture(autouse=True)
def run_around_tests():
    # Setup: Insert fresh mock users into database before each test run
    db = TestingSessionLocal()
    db.query(Report).delete()
    db.query(AssessmentResult).delete()
    db.query(AssessmentResponse).delete()
    db.query(AssessmentSession).delete()
    db.query(User).delete()
    
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
    response = client.post("/api/v1/assessments", json={"assessment_version": "1.0"})
    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"
    assert response.json()["assessment_version"] == "1.0"

def test_response_persistence_works():
    global active_user_id
    active_user_id = USER_1_ID
    # 1. Create session
    sess_res = client.post("/api/v1/assessments", json={"assessment_version": "1.0"})
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
    sess_res = client.post("/api/v1/assessments", json={"assessment_version": "1.0"})
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
