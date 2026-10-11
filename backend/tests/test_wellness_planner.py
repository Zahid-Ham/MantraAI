import os
import sys
import pytest
from datetime import date, datetime, timedelta
from uuid import uuid4
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.database import Base, get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, Report
from app.models.wellness_plan import WellnessPlan, WellnessActionItem, WellnessActionLog
from app.models.health import AdaptiveGoal
from app.models.consent import UserConsent
from app.services.wellness_plan_service import WellnessPlanService

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

    # Purge tables before each test
    db = TestingSessionLocal()
    db.query(WellnessActionLog).delete()
    db.query(WellnessActionItem).delete()
    db.query(WellnessPlan).delete()
    db.query(AdaptiveGoal).delete()
    db.query(Report).delete()
    db.query(AssessmentSession).delete()
    db.query(UserConsent).delete()
    db.query(User).delete()

    u1 = User(
        id=USER_1_ID,
        firebase_uid="planner_test_uid_1",
        email="planner1@mantraai.com",
        display_name="Planner User 1",
    )
    u2 = User(
        id=USER_2_ID,
        firebase_uid="planner_test_uid_2",
        email="planner2@mantraai.com",
        display_name="Planner User 2",
    )
    db.add(u1)
    db.add(u2)
    db.add(UserConsent(user_id=USER_1_ID, consent_type="HEALTH_DATA_PROCESSING", policy_version="1.0", action="ACCEPTED"))
    db.add(UserConsent(user_id=USER_2_ID, consent_type="HEALTH_DATA_PROCESSING", policy_version="1.0", action="ACCEPTED"))
    db.commit()
    db.close()
    yield


# ── 1. PLAN GENERATION WITHOUT ASSESSMENT (BASELINE EDUCATIONAL) ────────────

def test_plan_generation_without_assessment():
    """When a user has no assessment report, an evidence-informed educational starter plan is provided."""
    response = client.get("/api/v1/wellness-plan/dashboard")
    assert response.status_code == 200
    data = response.json()

    assert data["has_assessment"] is False
    assert data["plan"] is not None
    assert data["plan"]["is_baseline_educational"] is True
    assert len(data["today_actions"]) >= 3

    # All baseline educational actions must have verified clinical guideline citations
    for action in data["today_actions"]:
        assert len(action["evidence_sources"]) > 0
        for src in action["evidence_sources"]:
            assert src["url"].startswith("http")
            assert src["source"] in ("WHO", "EAU", "AUA/ASRM", "ICMR")


# ── 2. PLAN GENERATION WITH COMPLETED ASSESSMENT REPORT ─────────────────────

def test_plan_generation_with_assessment_report():
    """When a user has a completed assessment report, personalized actions and citations are derived from it."""
    db = TestingSessionLocal()
    session = AssessmentSession(
        id=uuid4(),
        user_id=USER_1_ID,
        assessment_version="1.0",
        status="COMPLETED",
        completed_at=datetime.utcnow(),
    )
    db.add(session)
    db.flush()

    report_content = {
        "report_metadata": {
            "report_version": "2.0",
            "generated_at": datetime.utcnow().isoformat(),
            "model_provider": "groq",
            "model_name": "llama-3.3-70b-versatile",
            "questionnaire_version": "1.0",
        },
        "personalized_action_plan": [
            {
                "id": "act-1",
                "title": "Establish cooler nocturnal sleeping conditions",
                "description": "Keep scrotal temperature moderated by wearing loose cotton sleepwear and avoiding direct laptop contact.",
                "domain": "environmental_exposure",
                "rationale": "Spermatogenesis requires testicular temperature 2-4 degrees Celsius below core body temperature.",
                "evidence_refs": ["eau-srh-2023"],
                "timeframe": "ongoing",
                "action_type": "lifestyle",
                "priority": 1,
            },
            {
                "id": "act-2",
                "title": "Incorporate structured aerobic intervals",
                "description": "Engage in 30 minutes of moderate aerobic activity 3 times per week.",
                "domain": "physical_activity",
                "rationale": "Improves cardiovascular reserve and endothelial nitric oxide availability.",
                "evidence_refs": ["who-pa-2020"],
                "timeframe": "3x weekly",
                "action_type": "lifestyle",
                "priority": 2,
            },
        ],
        "evidence": [
            {
                "evidence_id": "eau-srh-2023",
                "title": "EAU Guidelines on Sexual and Reproductive Health",
                "source": "EAU",
                "organization": "European Association of Urology",
                "year": 2023,
                "url": "https://uroweb.org/guidelines/sexual-and-reproductive-health",
                "source_identifier": "EAU-GL-SRH-2023",
                "relevance": "Testicular thermoregulation physiology and lifestyle guidance.",
            },
            {
                "evidence_id": "who-pa-2020",
                "title": "WHO Guidelines on Physical Activity and Sedentary Behaviour",
                "source": "WHO",
                "organization": "World Health Organization",
                "year": 2020,
                "url": "https://www.who.int/publications/i/item/9789240015128",
                "source_identifier": "ISBN: 978-92-4-001512-8",
                "relevance": "Weekly aerobic movement benchmarks.",
            },
        ],
    }

    report = Report(
        assessment_session_id=session.id,
        report_version="2.0",
        model_provider="groq",
        model_name="llama-3.3-70b-versatile",
        report_content=report_content,
    )
    db.add(report)
    db.commit()
    db.close()

    # Generate plan
    res = client.post("/api/v1/wellness-plan/generate")
    assert res.status_code == 200
    plan_data = res.json()

    assert plan_data["is_baseline_educational"] is False
    assert len(plan_data["action_items"]) == 2

    # Verify provenance preserved
    action_1 = next(a for a in plan_data["action_items"] if "cooler" in a["title"].lower())
    assert action_1["domain"] == "environmental_exposure"
    assert len(action_1["evidence_sources"]) == 1
    assert action_1["evidence_sources"][0]["source"] == "EAU"
    assert action_1["evidence_sources"][0]["source_identifier"] == "EAU-GL-SRH-2023"


# ── 3. DUPLICATE ACTION PREVENTION ──────────────────────────────────────────

def test_duplicate_action_prevention():
    """Generating or adding duplicate actions produces deterministic keys and avoids duplicate entries."""
    db = TestingSessionLocal()
    u1 = db.query(User).filter(User.id == USER_1_ID).first()
    plan1 = WellnessPlanService.get_or_create_user_plan(u1, db)
    initial_count = len(plan1.action_items)

    # Calling get_or_create again without force_regenerate returns same plan
    plan2 = WellnessPlanService.get_or_create_user_plan(u1, db)
    assert plan2.id == plan1.id
    assert len(plan2.action_items) == initial_count
    db.close()


# ── 4. ACTION LOGGING, ADHERENCE, AND HISTORY ────────────────────────────────

def test_action_logging_complete_skip_postpone():
    """Users can mark an action as completed, skipped, or postponed."""
    # Initialize dashboard
    dash = client.get("/api/v1/wellness-plan/dashboard").json()
    action = dash["today_actions"][0]
    action_id = action["id"]

    # 1. Log completed
    res1 = client.post(
        f"/api/v1/wellness-plan/actions/{action_id}/log",
        json={"status": "completed", "notes": "Completed morning routine"},
    )
    assert res1.status_code == 200
    log1 = res1.json()
    assert log1["status"] == "completed"
    assert log1["notes"] == "Completed morning routine"

    # Verify reflected in dashboard
    dash2 = client.get("/api/v1/wellness-plan/dashboard").json()
    updated_act = next(a for a in dash2["today_actions"] if a["id"] == action_id)
    assert updated_act["today_status"] == "completed"

    # 2. Update to skipped (idempotent change)
    res2 = client.post(
        f"/api/v1/wellness-plan/actions/{action_id}/log",
        json={"status": "skipped", "notes": "Busy with exams"},
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "skipped"

    # 3. Postpone
    res3 = client.post(
        f"/api/v1/wellness-plan/actions/{action_id}/log",
        json={"status": "postponed"},
    )
    assert res3.status_code == 200
    assert res3.json()["status"] == "postponed"


def test_action_status_pause_and_resume():
    """Users can pause, resume, and dismiss actions."""
    dash = client.get("/api/v1/wellness-plan/dashboard").json()
    action_id = dash["today_actions"][0]["id"]

    # Pause action
    res_pause = client.patch(
        f"/api/v1/wellness-plan/actions/{action_id}/state",
        json={"status": "paused"},
    )
    assert res_pause.status_code == 200
    assert res_pause.json()["status"] == "paused"

    # Verify moved to paused_or_dismissed_actions
    dash2 = client.get("/api/v1/wellness-plan/dashboard").json()
    assert any(a["id"] == action_id for a in dash2["paused_or_dismissed_actions"])
    assert not any(a["id"] == action_id for a in dash2["today_actions"])

    # Resume action
    res_resume = client.patch(
        f"/api/v1/wellness-plan/actions/{action_id}/state",
        json={"status": "active"},
    )
    assert res_resume.status_code == 200
    assert res_resume.json()["status"] == "active"

    # Verify back in today_actions
    dash3 = client.get("/api/v1/wellness-plan/dashboard").json()
    assert any(a["id"] == action_id for a in dash3["today_actions"])


# ── 5. ADAPTIVE GOAL INTEGRATION ────────────────────────────────────────────

def test_adaptive_goal_integration_in_planner():
    """Existing adaptive movement and sleep goals appear seamlessly in the planner dashboard."""
    response = client.get("/api/v1/wellness-plan/dashboard")
    assert response.status_code == 200
    data = response.json()

    assert "adaptive_goals" in data
    assert len(data["adaptive_goals"]) >= 3

    goal_types = [g["goal_type"] for g in data["adaptive_goals"]]
    assert "steps" in goal_types
    assert "active_minutes" in goal_types
    assert "sleep_consistency" in goal_types


# ── 6. CROSS-USER OWNERSHIP ENFORCEMENT ──────────────────────────────────────

def test_cross_user_isolation():
    """User 2 cannot log or modify User 1's actions."""
    global active_user_id

    # User 1 sets up plan
    active_user_id = USER_1_ID
    dash1 = client.get("/api/v1/wellness-plan/dashboard").json()
    u1_action_id = dash1["today_actions"][0]["id"]

    # Switch to User 2
    active_user_id = USER_2_ID

    # Attempt to log User 1's action
    res_log = client.post(
        f"/api/v1/wellness-plan/actions/{u1_action_id}/log",
        json={"status": "completed"},
    )
    assert res_log.status_code == 404

    # Attempt to pause User 1's action
    res_patch = client.patch(
        f"/api/v1/wellness-plan/actions/{u1_action_id}/state",
        json={"status": "paused"},
    )
    assert res_patch.status_code == 404


# ── 7. VALIDATION AND ERROR HANDLING ────────────────────────────────────────

def test_invalid_action_status_rejected():
    """Invalid status values are rejected with 400 Bad Request."""
    dash = client.get("/api/v1/wellness-plan/dashboard").json()
    action_id = dash["today_actions"][0]["id"]

    res = client.post(
        f"/api/v1/wellness-plan/actions/{action_id}/log",
        json={"status": "not_a_valid_status"},
    )
    assert res.status_code == 400


def test_weekly_adherence_calculation():
    """Weekly adherence calculates completion rate and streak accurately."""
    dash = client.get("/api/v1/wellness-plan/dashboard").json()
    action_1_id = dash["today_actions"][0]["id"]
    action_2_id = dash["today_actions"][1]["id"]

    # Log 1 complete and 1 skip today
    client.post(f"/api/v1/wellness-plan/actions/{action_1_id}/log", json={"status": "completed"})
    client.post(f"/api/v1/wellness-plan/actions/{action_2_id}/log", json={"status": "skipped"})

    stats = client.get("/api/v1/wellness-plan/adherence").json()
    assert stats["completed_count"] == 1
    assert stats["skipped_count"] == 1
    assert stats["total_scheduled_actions"] == 2
    assert stats["completion_rate_pct"] == 50.0
    assert stats["streak_days"] >= 1
    assert "not clinical fertility" in stats["disclaimer"]
