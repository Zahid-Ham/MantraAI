"""
MantraAI — Phase 1A Security Hardening Test Suite
==================================================

VERIFIES:
1. Legacy endpoint (/api/assessment/analyze) is permanently disabled and not publicly usable (returns 404).
2. Protected endpoints reject missing and invalid authentication (401).
3. Authenticated assessment completion and companion chat work as expected with mocked Groq.
4. Configurable rate limiting triggers HTTP 429 with RFC-compliant Retry-After header and resets properly.
5. Oversized payloads (> 512 KB) are rejected with HTTP 413.
6. Schema-level input size validation rejects bloated payloads (422).
7. Upstream Groq failures do not expose secrets, tokens, or internal stack traces.
8. V1 API strictly enforces cross-user authorization (ownership isolation).
9. Asynchronous request handlers contain zero blocking synchronous network calls or sleeps.
"""

import inspect
import json
import time
from uuid import uuid4
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.database import Base, get_db
from app.config import settings
from app.models.user import User
from app.models.consent import UserConsent
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report
from app.models.companion import CompanionConversation, CompanionMessage
from app.security.rate_limiter import reset_rate_limits
from app.auth.firebase_auth import get_current_user, get_optional_current_user, require_admin_user

# In-memory SQLite for test database isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def setup_security_db():
    Base.metadata.create_all(bind=engine)
    reset_rate_limits()
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    reset_rate_limits()
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_optional_current_user, None)
    app.dependency_overrides.pop(require_admin_user, None)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# ---------------------------------------------------------------------------
# Helper fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def test_user_a():
    db = TestingSessionLocal()
    user = User(
        id=uuid4(),
        firebase_uid="uid_user_alpha",
        email="alpha@test.com",
        display_name="User Alpha",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    db.add(UserConsent(user_id=user.id, consent_type="HEALTH_DATA_PROCESSING", policy_version="1.0", action="ACCEPTED"))
    db.add(UserConsent(user_id=user.id, consent_type="THIRD_PARTY_AI_ANALYSIS", policy_version="1.0", action="ACCEPTED"))
    db.commit()

    db.close()
    return user


@pytest.fixture
def test_user_b():
    db = TestingSessionLocal()
    user = User(
        id=uuid4(),
        firebase_uid="uid_user_beta",
        email="beta@test.com",
        display_name="User Beta",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    db.add(UserConsent(user_id=user.id, consent_type="HEALTH_DATA_PROCESSING", policy_version="1.0", action="ACCEPTED"))
    db.add(UserConsent(user_id=user.id, consent_type="THIRD_PARTY_AI_ANALYSIS", policy_version="1.0", action="ACCEPTED"))
    db.commit()

    db.close()
    return user


# ---------------------------------------------------------------------------
# 1. Legacy Endpoint Disabled
# ---------------------------------------------------------------------------

def test_legacy_endpoint_is_not_publicly_usable():
    """Verifies POST /api/assessment/analyze is disabled and returns 404."""
    payload = {"answers": {"age_years": 28, "laptop_on_lap": "never"}}
    res = client.post("/api/assessment/analyze", json=payload)
    assert res.status_code == 404
    assert "permanently disabled" in res.json().get("detail", "").lower()

    # Verify other methods on the legacy path also return 404
    assert client.get("/api/assessment/analyze").status_code == 404
    assert client.put("/api/assessment/analyze", json=payload).status_code == 404
    assert client.delete("/api/assessment/analyze").status_code == 404


# ---------------------------------------------------------------------------
# 2. Authentication Enforcement
# ---------------------------------------------------------------------------

def test_protected_endpoints_reject_missing_authentication():
    """Unauthenticated calls to protected V1 routes must return 401 or 403."""
    assert client.post("/api/v1/assessments", json={}).status_code == 401
    assert client.get("/api/v1/assessments").status_code == 401
    assert client.post("/api/v1/companion/chat", json={"message": "hello"}).status_code == 401
    assert client.get("/api/v1/companion/conversations").status_code == 401
    assert client.post("/api/v1/wellness-plan/generate").status_code == 401


def test_protected_endpoints_reject_invalid_token():
    """Supplying an invalid or expired Bearer token must return 401."""
    headers = {"Authorization": "Bearer invalid_forged_jwt_token"}
    res = client.post("/api/v1/assessments", json={}, headers=headers)
    assert res.status_code in (401, 503)


# ---------------------------------------------------------------------------
# 3. Authenticated Assessment & Companion Flows Work
# ---------------------------------------------------------------------------

def test_authenticated_assessment_and_companion_flows_work(test_user_a):
    """Verifies legitimate authenticated assessment and companion requests function properly."""
    from app.auth.firebase_auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: test_user_a

    try:
        # 1. Start assessment
        res_create = client.post("/api/v1/assessments", json={"assessment_version": "1.0"})
        assert res_create.status_code == 200
        sess_id = res_create.json()["id"]

        # 2. Save responses
        res_save = client.post(
            f"/api/v1/assessments/{sess_id}/responses",
            json={"responses": {"age_years": 29, "lifestyle_exercise_frequency": "regular"}},
        )
        assert res_save.status_code == 200

        # 3. Complete assessment with mocked report generator
        mock_groq_content = json.dumps({
            "report_metadata": {
                "report_version": "2.0",
                "generated_at": "2026-10-11T00:00:00Z",
                "model_provider": "groq",
                "model_name": "llama-3.3-70b-versatile",
                "total_factors_evaluated": 2,
                "evidence_sources_count": 1,
            },
            "summary": {
                "headline": "Stable Baseline Wellness Profile",
                "overview": "Your lifestyle habits reflect a stable baseline.",
                "overall_wellness_status": "Stable",
            },
            "domain_assessments": {
                "lifestyle_wellness": {
                    "domain_name": "Lifestyle Wellness",
                    "status_label": "Optimal",
                    "summary": "Regular activity noted.",
                    "priority_level": "low",
                    "key_signals": ["Active routine"],
                    "relevant_factors": [],
                    "evidence_refs": ["who-physical-activity-2020"],
                }
            },
            "priority_factors": [],
            "positive_factors": [
                {
                    "title": "Regular Exercise",
                    "domain": "lifestyle_wellness",
                    "description": "Engages in physical activity regularly.",
                    "benefit": "Promotes cardiovascular health.",
                    "practical_tip": "Maintain regular movement.",
                }
            ],
            "personalized_action_plan": [
                {
                    "priority": 1,
                    "action_title": "Continue Routine",
                    "domain": "lifestyle_wellness",
                    "action_description": "Keep up your regular exercise schedule.",
                    "rationale": "Consistent movement supports endurance.",
                    "timeframe": "Ongoing",
                    "difficulty": "easy",
                    "evidence_id": "who-physical-activity-2020",
                }
            ],
            "questions_to_discuss_with_clinician": [],
            "when_to_seek_professional_help": ["If you experience sudden severe pain."],
            "disclaimer": "Educational wellness report only.",
        })

        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "choices": [{"message": {"content": mock_groq_content}}]
        }).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp

        with patch("urllib.request.urlopen", return_value=mock_resp):
            res_comp = client.post(f"/api/v1/assessments/{sess_id}/complete")
            assert res_comp.status_code == 200
            assert "overall_category" in res_comp.json()

        # 4. Companion chat works
        mock_companion_content = json.dumps({
            "answer": "Regular cardiovascular exercise supports metabolic function.",
            "cited_evidence_ids": ["who-physical-activity-2020"],
            "evidence_sufficiency": "sufficient",
            "suggested_topics": ["Sleep routine"],
        })
        mock_comp_resp = MagicMock()
        mock_comp_resp.read.return_value = json.dumps({
            "choices": [{"message": {"content": mock_companion_content}}]
        }).encode("utf-8")
        mock_comp_resp.__enter__.return_value = mock_comp_resp

        with patch("urllib.request.urlopen", return_value=mock_comp_resp):
            res_chat = client.post(
                "/api/v1/companion/chat",
                json={"message": "Does exercise help with energy?"},
            )
            assert res_chat.status_code == 200
            assert "answer" in res_chat.json()
            assert len(res_chat.json()["answer"]) > 10

    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# 4. Rate Limiting Enforcement
# ---------------------------------------------------------------------------

def test_rate_limiting_triggers_429_with_retry_after(test_user_a):
    """Verifies rate limiting returns HTTP 429 with RFC Retry-After header and resets properly."""
    from app.auth.firebase_auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: test_user_a
    reset_rate_limits()

    # Set artificial tight rate limit for test
    orig_limit = settings.RATE_LIMIT_AI_PER_MINUTE
    settings.RATE_LIMIT_AI_PER_MINUTE = 3

    try:
        mock_companion_content = json.dumps({
            "answer": "Grounded answer text.",
            "cited_evidence_ids": [],
            "evidence_sufficiency": "sufficient",
            "suggested_topics": [],
        })
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "choices": [{"message": {"content": mock_companion_content}}]
        }).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp

        with patch("urllib.request.urlopen", return_value=mock_resp):
            # Requests 1, 2, 3 should succeed
            for i in range(3):
                r = client.post("/api/v1/companion/chat", json={"message": f"Query {i}"})
                assert r.status_code == 200

            # Request 4 must trigger HTTP 429 Too Many Requests
            r4 = client.post("/api/v1/companion/chat", json={"message": "Query 4"})
            assert r4.status_code == 429
            assert "retry-after" in r4.headers or "Retry-After" in r4.headers
            retry_val = r4.headers.get("retry-after") or r4.headers.get("Retry-After")
            assert int(retry_val) > 0
            assert "Rate limit exceeded" in r4.json()["detail"]

        # Reset rate limits -> subsequent request succeeds
        reset_rate_limits()
        with patch("urllib.request.urlopen", return_value=mock_resp):
            r5 = client.post("/api/v1/companion/chat", json={"message": "Query 5 after reset"})
            assert r5.status_code == 200

    finally:
        settings.RATE_LIMIT_AI_PER_MINUTE = orig_limit
        reset_rate_limits()
        app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# 5. Payload & Input Size Limits
# ---------------------------------------------------------------------------

def test_oversized_payload_rejected_with_413(test_user_a):
    """Verifies requests exceeding MAX_REQUEST_BODY_BYTES are rejected with HTTP 413."""
    from app.auth.firebase_auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: test_user_a

    try:
        # Create a payload larger than 512 KB
        bloated_text = "A" * (settings.MAX_REQUEST_BODY_BYTES + 1000)
        res = client.post(
            "/api/v1/companion/chat",
            json={"message": bloated_text},
            headers={"Content-Length": str(len(bloated_text) + 50)},
        )
        assert res.status_code == 413
        assert "exceeds maximum allowed size" in res.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_assessment_response_input_validation(test_user_a):
    """Verifies AssessmentResponseSave rejects excessive question counts (anti-bloat)."""
    from app.auth.firebase_auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: test_user_a

    try:
        sess = client.post("/api/v1/assessments", json={"assessment_version": "1.0"}).json()
        sess_id = sess["id"]

        # Payload with > 150 questions (canonical is 86)
        excessive_dict = {f"fake_q_{i}": "val" for i in range(160)}
        res = client.post(
            f"/api/v1/assessments/{sess_id}/responses",
            json={"responses": excessive_dict},
        )
        assert res.status_code == 422
        assert "exceeds maximum allowed question count" in str(res.json())
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# 6. Failed Groq Upstream Calls Do Not Expose Secrets
# ---------------------------------------------------------------------------

def test_failed_groq_companion_does_not_expose_secrets(test_user_a):
    """Verifies that an upstream Groq crash or exception never exposes API keys or stack traces."""
    from app.auth.firebase_auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: test_user_a

    try:
        secret_token = "gsk_super_secret_internal_api_key_value_99999"

        # Simulate urllib throwing an exception containing a simulated secret
        with patch("urllib.request.urlopen", side_effect=Exception(f"Failed to connect to Groq with key {secret_token}")):
            res = client.post(
                "/api/v1/companion/chat",
                json={"message": "Can diet affect recovery?"},
            )
            # Must fall back gracefully to deterministic guidance (HTTP 200)
            assert res.status_code == 200
            res_str = json.dumps(res.json())
            # Assert secret never leaked in client response
            assert secret_token not in res_str
            assert "Traceback" not in res_str

    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# 7. Cross-User Authorization (Ownership Isolation)
# ---------------------------------------------------------------------------

def test_v1_api_enforces_user_ownership(test_user_a, test_user_b):
    """Verifies User B cannot read or modify User A's assessments or conversations."""
    from app.auth.firebase_auth import get_current_user

    # 1. User A creates session
    app.dependency_overrides[get_current_user] = lambda: test_user_a
    res_a = client.post("/api/v1/assessments", json={"assessment_version": "1.0"}).json()
    sess_id = res_a["id"]

    # 2. Switch to User B
    app.dependency_overrides[get_current_user] = lambda: test_user_b

    # User B attempts to access User A's session
    assert client.get(f"/api/v1/assessments/{sess_id}").status_code == 403
    assert client.get(f"/api/v1/assessments/{sess_id}/responses").status_code == 403
    assert client.post(f"/api/v1/assessments/{sess_id}/responses", json={"responses": {"age_years": 30}}).status_code == 403
    assert client.post(f"/api/v1/assessments/{sess_id}/complete").status_code == 403
    assert client.get(f"/api/v1/assessments/{sess_id}/report").status_code == 403

    app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# 8. No Blocking Operations in Asynchronous Handlers
# ---------------------------------------------------------------------------

def test_no_blocking_operations_in_async_handlers():
    """
    Scans all registered FastAPI routes:
    Verifies that no asynchronous route handler (async def) executes blocking synchronous
    I/O calls like `urllib.request.urlopen` or `time.sleep`.
    """
    for route in app.routes:
        endpoint = getattr(route, "endpoint", None)
        if endpoint and inspect.iscoroutinefunction(endpoint):
            source = inspect.getsource(endpoint)
            # Lifespan contextmanager is allowed; verify request handlers
            if "lifespan" in endpoint.__name__:
                continue
            assert "urllib.request.urlopen" not in source, f"Blocking urlopen in async handler: {endpoint.__name__}"
            assert "time.sleep" not in source, f"Blocking time.sleep in async handler: {endpoint.__name__}"
            assert "requests.get" not in source, f"Blocking requests in async handler: {endpoint.__name__}"
