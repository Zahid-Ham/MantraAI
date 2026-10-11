import datetime as dt
from uuid import uuid4
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlite3 import Connection as SQLite3Connection

from app.database import Base, get_db
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult
from app.models.health import HealthConnection, HealthDailyMetrics, AdaptiveGoal
from app.models.audit import AuditEvent
from app.models.semen_report import SemenReport
from app.models.cycle_plan import CyclePlan
from app.models.shared_report import SharedReport
from main import app

# In-memory SQLite with foreign keys enabled
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, SQLite3Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

USER_1_ID = uuid4()
USER_2_ID = uuid4()
active_user_id = USER_1_ID


def override_get_current_user():
    if active_user_id is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Unauthenticated")
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.id == active_user_id).first()
        if not user:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="User not found")
        return user
    finally:
        db.close()


from app.auth.firebase_auth import get_current_user
app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    user1 = User(
        id=USER_1_ID,
        firebase_uid="firebase-user-1",
        email="user1@example.com",
        display_name="User One",
    )
    user2 = User(
        id=USER_2_ID,
        firebase_uid="firebase-user-2",
        email="user2@example.com",
        display_name="User Two",
    )
    db.add(user1)
    db.add(user2)
    db.commit()
    db.close()

    global active_user_id
    active_user_id = USER_1_ID
    yield


def test_unauthenticated_requests_return_401():
    global active_user_id
    active_user_id = None

    export_res = client.get("/api/v1/users/me/export")
    assert export_res.status_code == 401

    del_res = client.request("DELETE", "/api/v1/users/me", json={"confirmation": "DELETE"})
    assert del_res.status_code == 401


def test_export_user_data_complete_and_isolated():
    global active_user_id
    active_user_id = USER_1_ID

    db = TestingSessionLocal()

    # Create assessment data for user 1
    session1 = AssessmentSession(
        id=uuid4(),
        user_id=USER_1_ID,
        status="COMPLETED",
        report_status="ready",
        started_at=dt.datetime.now(dt.timezone.utc),
        completed_at=dt.datetime.now(dt.timezone.utc),
    )
    session1_id = str(session1.id)
    db.add(session1)
    db.flush()

    resp1 = AssessmentResponse(
        assessment_session_id=session1.id,
        question_id="age_years",
        response_value="30",
    )
    res1 = AssessmentResult(
        assessment_session_id=session1.id,
        overall_category="low_risk",
        risk_scores={"lifestyle": 10},
        interpretation="Optimal markers observed.",
    )
    db.add_all([resp1, res1])

    # Health data for user 1
    conn = HealthConnection(
        user_id=USER_1_ID,
        provider="mock",
        status="active",
        display_name="Mock Tracker",
    )
    metric = HealthDailyMetrics(
        user_id=USER_1_ID,
        date=dt.date.today(),
        source="mock",
        steps=8500,
        active_minutes=45,
    )
    goal = AdaptiveGoal(
        user_id=USER_1_ID,
        date=dt.date.today(),
        goal_type="steps",
        title="Walk 8000 steps",
        target_value=8000.0,
        source="system",
        status="completed",
    )
    audit = AuditEvent(
        user_id=USER_1_ID,
        event_type="assessment_completed",
        event_metadata={"session_id": str(session1.id)},
    )
    db.add_all([conn, metric, goal, audit])

    # Data for User 2 (must NOT appear in User 1's export)
    conn2 = HealthConnection(
        user_id=USER_2_ID,
        provider="mock",
        status="active",
        display_name="User 2 Tracker",
    )
    db.add(conn2)
    db.commit()
    db.close()

    # Call Export
    res = client.get("/api/v1/users/me/export")
    assert res.status_code == 200
    data = res.json()

    assert data["user"]["id"] == str(USER_1_ID)
    assert data["user"]["email"] == "user1@example.com"
    assert len(data["assessment_sessions"]) == 1
    assert data["assessment_sessions"][0]["session_id"] == session1_id
    assert len(data["assessment_sessions"][0]["responses"]) == 1
    assert data["assessment_sessions"][0]["responses"][0]["question_id"] == "age_years"

    assert len(data["health_connections"]) == 1
    assert data["health_connections"][0]["display_name"] == "Mock Tracker"
    assert len(data["health_daily_metrics"]) == 1
    assert data["health_daily_metrics"][0]["steps"] == 8500
    assert len(data["adaptive_goals"]) == 1
    assert len(data["audit_events"]) == 1
    assert "exported_at" in data


def test_delete_user_requires_valid_confirmation():
    global active_user_id
    active_user_id = USER_1_ID

    # Missing confirmation
    res1 = client.request("DELETE", "/api/v1/users/me", json={})
    assert res1.status_code == 422  # validation error

    # Invalid confirmation string
    res2 = client.request("DELETE", "/api/v1/users/me", json={"confirmation": "no"})
    assert res2.status_code == 400
    assert "Confirmation required" in res2.json()["detail"]


@patch("firebase_admin.auth.delete_user")
def test_delete_user_cascades_and_sets_null_audit(mock_fb_delete):
    global active_user_id
    active_user_id = USER_1_ID

    db = TestingSessionLocal()

    # Populate all tables for User 1
    session = AssessmentSession(
        id=uuid4(),
        user_id=USER_1_ID,
        status="COMPLETED",
        report_status="ready",
    )
    session_id = session.id
    db.add(session)
    db.flush()

    resp = AssessmentResponse(
        assessment_session_id=session_id,
        question_id="age_years",
        response_value="32",
    )
    result = AssessmentResult(
        assessment_session_id=session.id,
        overall_category="low_risk",
        risk_scores={"lifestyle": 10},
        interpretation="Optimal markers observed.",
    )
    conn = HealthConnection(
        user_id=USER_1_ID,
        provider="mock",
        status="active",
    )
    metric = HealthDailyMetrics(
        user_id=USER_1_ID,
        date=dt.date.today(),
        source="mock",
        steps=7000,
    )
    goal = AdaptiveGoal(
        user_id=USER_1_ID,
        date=dt.date.today(),
        goal_type="steps",
        title="Walk steps",
        target_value=7000.0,
        source="system",
    )
    audit = AuditEvent(
        id=uuid4(),
        user_id=USER_1_ID,
        event_type="login",
        event_metadata={"method": "email"},
    )
    db.add_all([resp, result, conn, metric, goal, audit])
    db.commit()
    audit_id = audit.id
    db.close()

    # Execute Account Deletion
    del_res = client.request("DELETE", "/api/v1/users/me", json={"confirmation": "DELETE"})
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

    # Verify Firebase delete was invoked with firebase_uid
    mock_fb_delete.assert_called_once_with("firebase-user-1")

    # Verify Database state
    db = TestingSessionLocal()

    # User row must be deleted
    assert db.query(User).filter(User.id == USER_1_ID).first() is None

    # Cascading tables must be empty for user 1
    assert db.query(AssessmentSession).filter(AssessmentSession.user_id == USER_1_ID).count() == 0
    assert db.query(AssessmentResponse).filter(AssessmentResponse.assessment_session_id == session_id).count() == 0
    assert db.query(AssessmentResult).filter(AssessmentResult.assessment_session_id == session_id).count() == 0
    assert db.query(HealthConnection).filter(HealthConnection.user_id == USER_1_ID).count() == 0
    assert db.query(HealthDailyMetrics).filter(HealthDailyMetrics.user_id == USER_1_ID).count() == 0
    assert db.query(AdaptiveGoal).filter(AdaptiveGoal.user_id == USER_1_ID).count() == 0

    # Audit events must be preserved with user_id SET NULL
    persisted_audit = db.query(AuditEvent).filter(AuditEvent.id == audit_id).first()
    assert persisted_audit is not None
    assert persisted_audit.user_id is None
    assert persisted_audit.event_type == "login"

    # Other users must be unaffected
    assert db.query(User).filter(User.id == USER_2_ID).first() is not None

    db.close()
