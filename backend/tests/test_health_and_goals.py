import os
import sys
import pytest
from datetime import date, datetime, timedelta
from uuid import uuid4
from fastapi import Depends
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.database import Base, get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, Report
from app.models.health import HealthConnection, HealthDailyMetrics, AdaptiveGoal
from app.schemas.health import NormalizedDailyHealthData
from app.services.health_provider import MockHealthProvider, get_health_provider
from app.services.adaptive_goal_engine import AdaptiveGoalEngine

# Configure test SQLite database engine
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Ensure all database tables exist
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

USER_1_ID = uuid4()
USER_2_ID = uuid4()
active_user_id = USER_1_ID

def override_get_current_user(db: Session = Depends(get_db)):
    if not active_user_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return db.query(User).filter(User.id == active_user_id).first()

@pytest.fixture(autouse=True)
def run_around_tests():
    global active_user_id
    active_user_id = USER_1_ID
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    # Purge health and user tables before each test
    db = TestingSessionLocal()
    db.query(AdaptiveGoal).delete()
    db.query(HealthDailyMetrics).delete()
    db.query(HealthConnection).delete()
    db.query(Report).delete()
    db.query(AssessmentSession).delete()
    db.query(User).delete()

    u1 = User(
        id=USER_1_ID,
        firebase_uid="health_test_uid_1",
        email="health1@mantraai.com",
        display_name="Health User 1",
    )
    u2 = User(
        id=USER_2_ID,
        firebase_uid="health_test_uid_2",
        email="health2@mantraai.com",
        display_name="Health User 2",
    )
    db.add(u1)
    db.add(u2)
    db.commit()
    db.close()
    yield


# ── 1. SCHEMA VALIDATION TESTS ──────────────────────────────────────────────

def test_normalized_health_data_valid():
    item = NormalizedDailyHealthData(
        source="mock",
        source_device="Mock Watch",
        date=date(2026, 10, 3),
        steps=6540,
        active_minutes=35,
        workout_minutes=20,
        sleep_duration_minutes=430,
        resting_heart_rate=72,
        active_calories=380.5,
    )
    assert item.steps == 6540
    assert item.active_minutes == 35
    assert item.resting_heart_rate == 72
    assert item.source == "mock"


def test_negative_health_metrics_rejected():
    with pytest.raises(ValidationError):
        NormalizedDailyHealthData(
            source="mock",
            date=date(2026, 10, 3),
            steps=-50,
        )

    with pytest.raises(ValidationError):
        NormalizedDailyHealthData(
            source="mock",
            date=date(2026, 10, 3),
            active_minutes=-10,
        )

    with pytest.raises(ValidationError):
        NormalizedDailyHealthData(
            source="mock",
            date=date(2026, 10, 3),
            resting_heart_rate=-70,
        )


def test_excessive_minute_bounds_rejected():
    with pytest.raises(ValidationError):
        NormalizedDailyHealthData(
            source="mock",
            date=date(2026, 10, 3),
            active_minutes=2000,  # exceeds 1440 minutes in a day
        )


# ── 2. MOCK HEALTH PROVIDER TESTS ────────────────────────────────────────────

def test_mock_provider_determinism():
    provider = get_health_provider("mock")
    target_d = date(2026, 10, 3)

    run1 = provider.fetch_daily_metrics(USER_1_ID, target_d, target_d)
    run2 = provider.fetch_daily_metrics(USER_1_ID, target_d, target_d)

    assert len(run1) == 1
    assert len(run2) == 1
    assert run1[0].steps == run2[0].steps
    assert run1[0].active_minutes == run2[0].active_minutes
    assert run1[0].sleep_duration_minutes == run2[0].sleep_duration_minutes
    assert run1[0].resting_heart_rate == run2[0].resting_heart_rate
    assert run1[0].active_calories == run2[0].active_calories


def test_mock_provider_day_variance():
    provider = MockHealthProvider()
    d1 = date(2026, 10, 1)
    d2 = date(2026, 10, 2)
    d3 = date(2026, 10, 3)

    metrics = provider.fetch_daily_metrics(USER_1_ID, d1, d3)
    assert len(metrics) == 3
    # Step counts across different days should show natural non-identical variance
    assert not (metrics[0].steps == metrics[1].steps == metrics[2].steps)


# ── 3. HEALTH CONNECTIONS API TESTS ──────────────────────────────────────────

def test_health_connection_enable_and_get():
    global active_user_id
    active_user_id = USER_1_ID

    # Post mock connection
    res = client.post("/api/v1/health/connections/mock")
    assert res.status_code == 200
    data = res.json()
    assert data["provider"] == "mock"
    assert data["status"] == "connected"

    # Get connections
    res2 = client.get("/api/v1/health/connections")
    assert res2.status_code == 200
    conns = res2.json()
    assert len(conns) == 1
    assert conns[0]["provider"] == "mock"


def test_health_connection_delete_ownership():
    global active_user_id
    active_user_id = USER_1_ID

    res = client.post("/api/v1/health/connections/mock")
    conn_id = res.json()["id"]

    # User 2 attempts to delete User 1's connection -> 404
    active_user_id = USER_2_ID
    del_res_other = client.delete(f"/api/v1/health/connections/{conn_id}")
    assert del_res_other.status_code == 404

    # User 1 deletes own connection -> 204
    active_user_id = USER_1_ID
    del_res_owner = client.delete(f"/api/v1/health/connections/{conn_id}")
    assert del_res_owner.status_code == 204


# ── 4. HEALTH SYNC SERVICE & IDEMPOTENCY TESTS ───────────────────────────────

def test_health_sync_idempotency():
    global active_user_id
    active_user_id = USER_1_ID

    start_d = (date.today() - timedelta(days=6)).isoformat()
    end_d = date.today().isoformat()

    # Sync 1: 7 new records inserted
    sync1 = client.post("/api/v1/health/sync", json={"provider": "mock", "start_date": start_d, "end_date": end_d})
    assert sync1.status_code == 200
    s1_data = sync1.json()
    assert s1_data["records_received"] == 7
    assert s1_data["records_inserted"] == 7
    assert s1_data["records_skipped"] == 0

    # Sync 2 on exact same range: 0 inserted, 7 skipped
    sync2 = client.post("/api/v1/health/sync", json={"provider": "mock", "start_date": start_d, "end_date": end_d})
    assert sync2.status_code == 200
    s2_data = sync2.json()
    assert s2_data["records_received"] == 7
    assert s2_data["records_inserted"] == 0
    assert s2_data["records_skipped"] == 7


def test_get_daily_metrics_and_user_isolation():
    global active_user_id
    active_user_id = USER_1_ID

    # Sync User 1
    client.post("/api/v1/health/sync", json={"provider": "mock"})
    res1 = client.get("/api/v1/health/daily")
    assert res1.status_code == 200
    user1_records = res1.json()
    assert len(user1_records) == 7

    # User 2 has 0 records (strict isolation)
    active_user_id = USER_2_ID
    res2 = client.get("/api/v1/health/daily")
    assert res2.status_code == 200
    assert len(res2.json()) == 0


def test_latest_daily_metric_empty_and_populated():
    global active_user_id
    active_user_id = USER_1_ID

    # Empty initially
    res_empty = client.get("/api/v1/health/daily/latest")
    assert res_empty.status_code == 200
    assert res_empty.json() is None

    # Sync data
    client.post("/api/v1/health/sync", json={"provider": "mock"})

    # Populated
    res_pop = client.get("/api/v1/health/daily/latest")
    assert res_pop.status_code == 200
    data = res_pop.json()
    assert data is not None
    assert "steps" in data
    assert "resting_heart_rate" in data
    assert data["source"] == "mock"


# ── 5. HEALTH TRENDS TESTS ───────────────────────────────────────────────────

def test_trends_insufficient_data():
    global active_user_id
    active_user_id = USER_1_ID

    # 0 days of data
    res = client.get("/api/v1/health/trends")
    assert res.status_code == 200
    data = res.json()
    for tr in data["trends"]:
        assert tr["direction"] == "insufficient_data"


def test_trends_calculated_with_data():
    global active_user_id
    active_user_id = USER_1_ID

    client.post("/api/v1/health/sync", json={"provider": "mock"})

    res = client.get("/api/v1/health/trends?days=7")
    assert res.status_code == 200
    data = res.json()
    assert len(data["trends"]) == 4
    metrics = {t["metric"]: t for t in data["trends"]}

    assert "steps" in metrics
    assert "active_minutes" in metrics
    assert "sleep_duration_minutes" in metrics
    assert "resting_heart_rate" in metrics
    assert metrics["steps"]["direction"] in {"improving", "maintaining", "declining"}
    assert len(metrics["steps"]["data"]) == 7


# ── 6. ADAPTIVE GOAL ENGINE TESTS ────────────────────────────────────────────

def test_adaptive_goal_generation_without_history():
    global active_user_id
    active_user_id = USER_1_ID

    res = client.get("/api/v1/goals/today")
    assert res.status_code == 200
    goals = res.json()
    assert len(goals) >= 3

    types = {g["goal_type"]: g for g in goals}
    assert "steps" in types
    assert "active_minutes" in types
    assert "sleep_consistency" in types

    # Starter targets applied when < 3 valid past days
    assert types["steps"]["target_value"] == 6000.0
    assert types["active_minutes"]["target_value"] == 30.0
    assert types["sleep_consistency"]["target_value"] == 420.0


def test_adaptive_goal_progression_with_history():
    db = TestingSessionLocal()
    # Insert 5 days of past step data with median ~6000
    for i in range(1, 6):
        m = HealthDailyMetrics(
            user_id=USER_1_ID,
            date=date.today() - timedelta(days=i),
            source="mock",
            steps=6000,
            active_minutes=40,
            sleep_duration_minutes=450,
            sync_status="synced",
        )
        db.add(m)
    db.commit()

    u = db.query(User).filter(User.id == USER_1_ID).first()
    goals = AdaptiveGoalEngine.get_or_create_daily_goals(u, date.today(), db)
    db.close()

    step_goal = next(g for g in goals if g.goal_type == "steps")
    # 6000 * 1.1 = 6600 -> rounded to nearest 500 = 6500.0
    assert step_goal.target_value == 6500.0


def test_goal_patch_status_and_ownership():
    global active_user_id
    active_user_id = USER_1_ID

    res = client.get("/api/v1/goals/today")
    goals = res.json()
    goal_id = goals[0]["id"]

    # User 2 attempts to update User 1's goal -> 404
    active_user_id = USER_2_ID
    res_other = client.patch(f"/api/v1/goals/{goal_id}", json={"status": "completed"})
    assert res_other.status_code == 404

    # User 1 updates own goal -> 200
    active_user_id = USER_1_ID
    res_owner = client.patch(f"/api/v1/goals/{goal_id}", json={"status": "completed"})
    assert res_owner.status_code == 200
    assert res_owner.json()["status"] == "completed"


def test_action_plan_goal_integration():
    db = TestingSessionLocal()
    # Add completed assessment session with structured report
    sess = AssessmentSession(
        user_id=USER_1_ID,
        status="COMPLETED",
        completed_at=datetime.utcnow(),
    )
    db.add(sess)
    db.flush()

    rep = Report(
        assessment_session_id=sess.id,
        model_provider="groq",
        model_name="llama-3.3-70b-versatile",
        report_content={
            "priority_recommendations": [
                {
                    "domain": "lifestyle",
                    "recommendation": "Incorporate 20 minutes of daily aerobic movement",
                    "timeframe": "immediate",
                }
            ]
        },
    )
    db.add(rep)
    db.commit()

    u = db.query(User).filter(User.id == USER_1_ID).first()
    goals = AdaptiveGoalEngine.get_or_create_daily_goals(u, date.today(), db)
    db.close()

    action_goal = next((g for g in goals if g.goal_type == "action_plan"), None)
    assert action_goal is not None
    assert "aerobic movement" in action_goal.title.lower()


def test_unauthenticated_requests_return_401():
    global active_user_id
    active_user_id = None

    assert client.get("/api/v1/health/connections").status_code == 401
    assert client.get("/api/v1/health/daily").status_code == 401
    assert client.post("/api/v1/health/sync").status_code == 401
    assert client.get("/api/v1/goals/today").status_code == 401
