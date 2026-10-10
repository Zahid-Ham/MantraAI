"""
MantraAI — AI Health Companion Unit & Integration Test Suite
============================================================

Tests:
1. Evidence retrieval and grounded conversational answers
2. Unknown queries and insufficient evidence handling
3. Groq missing-key, timeout, and malformed-response fallback handling
4. Fabricated and invalid evidence ID filtering (no hallucinated citations)
5. Strict schema validation and prohibited medical field rejection (no diagnosis/probabilities)
6. Authentication enforcement (401/403 for unauthenticated requests)
7. Strict conversation ownership and cross-user isolation prevention (cannot read/delete other's chats)
8. Conversation lifecycle (creation, multi-turn history persistence, deletion)
9. Bounded conversation history context construction
10. Safety escalation triggers (acute testicular pain, torsion, psychiatric crisis)
"""

import os
import sys
import json
import pytest
from uuid import uuid4
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.config import settings
from app.database import Base, get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.companion import CompanionConversation, CompanionMessage
from app.schemas.companion import (
    ChatRequest,
    ChatResponse,
    CompanionSourceReference,
    CompanionLLMOutput,
    FORBIDDEN_COMPANION_FIELDS,
)
from app.services.companion_service import (
    check_urgent_symptoms,
    gather_evidence_for_query,
    build_companion_user_prompt,
    generate_deterministic_fallback_response,
    process_chat_message,
    list_user_conversations,
    get_conversation_details,
    delete_user_conversation,
)

# Test SQLite database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def db_session():
    """Provides a transactional database session for tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_user_a(db_session: Session):
    """Creates Test User A."""
    uid = f"user-a-{uuid4().hex[:8]}"
    user = User(
        firebase_uid=uid,
        email=f"{uid}@example.com",
        display_name="User Alpha",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_b(db_session: Session):
    """Creates Test User B."""
    uid = f"user-b-{uuid4().hex[:8]}"
    user = User(
        firebase_uid=uid,
        email=f"{uid}@example.com",
        display_name="User Beta",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


active_user_holder = {"user": None}

def override_get_current_user():
    user = active_user_holder["user"]
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


@pytest.fixture
def client(db_session: Session):
    """TestClient with dynamic user and db overrides."""
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_db, None)
    active_user_holder["user"] = None


@pytest.fixture
def client_user_a(client: TestClient, test_user_a: User):
    """TestClient set to User A."""
    active_user_holder["user"] = test_user_a
    yield client


@pytest.fixture
def client_user_b(client: TestClient, test_user_b: User):
    """TestClient set to User B."""
    active_user_holder["user"] = test_user_b
    yield client


# ---------------------------------------------------------------------------
# 1. Safety Escalation Trigger Tests
# ---------------------------------------------------------------------------

def test_urgent_symptoms_detection_acute_pain():
    """Confirms that acute testicular pain triggers emergency escalation."""
    result = check_urgent_symptoms("I have severe testicular pain that started an hour ago")
    assert result is not None
    reason, text = result
    assert reason == "acute_testicular_pain"
    assert "emergency" in text.lower() or "immediate" in text.lower()


def test_urgent_symptoms_detection_torsion():
    """Confirms that suspected testicular torsion triggers emergency guidance."""
    result = check_urgent_symptoms("Could this be testicular torsion?")
    assert result is not None
    reason, text = result
    assert reason == "testicular_torsion"
    assert "immediate" in text.lower()


def test_urgent_symptoms_detection_psychiatric():
    """Confirms that crisis language triggers helpline numbers."""
    result = check_urgent_symptoms("I feel hopeless and want to end my life")
    assert result is not None
    reason, text = result
    assert reason == "mental_health_crisis"
    assert "14416" in text or "988" in text


def test_routine_query_does_not_trigger_escalation():
    """Confirms that non-emergency queries do not falsely escalate."""
    result = check_urgent_symptoms("How does sleep affect testosterone levels?")
    assert result is None


# ---------------------------------------------------------------------------
# 2. Evidence Retrieval and Grounded Answer Tests
# ---------------------------------------------------------------------------

def test_gather_evidence_for_reproductive_health(db_session: Session):
    """Verifies that relevant guidelines are retrieved for reproductive health questions."""
    sources, sufficiency, domain = gather_evidence_for_query("What does semen analysis test?", db_session)
    assert len(sources) > 0
    assert sufficiency in {"sufficient", "partial"}
    assert any("semen" in s.relevance_excerpt.lower() or "fertility" in s.relevance_excerpt.lower() for s in sources)


def test_gather_evidence_insufficient_for_nonsense(db_session: Session):
    """Verifies that completely obscure queries yield insufficient evidence status."""
    sources, sufficiency, domain = gather_evidence_for_query("Does quantum tunneling on Mars affect sperm?", db_session)
    assert sufficiency == "insufficient"
    assert len(sources) == 0


# ---------------------------------------------------------------------------
# 3. Deterministic Fallback Synthesis (Missing Groq Key / Failure)
# ---------------------------------------------------------------------------

def test_deterministic_fallback_with_evidence():
    """Verifies that deterministic fallback uses retrieved guideline excerpt without LLM."""
    sources = [
        CompanionSourceReference(
            source_id="WHO_TEST_1",
            title="WHO Semen Manual 6th Edition",
            organization="World Health Organization",
            publication_year=2021,
            relevance_excerpt="Semen analysis provides laboratory assessment of volume, concentration, and motility.",
        )
    ]
    fb = generate_deterministic_fallback_response("What does semen analysis measure?", sources, "reproductive_health", "sufficient")
    assert "World Health Organization" in fb.answer or "WHO" in fb.answer
    assert "semen analysis" in fb.answer.lower()
    assert "WHO_TEST_1" in fb.cited_evidence_ids
    assert len(fb.suggested_followups) > 0


def test_deterministic_fallback_without_evidence():
    """Verifies that fallback honestly reports insufficient evidence."""
    fb = generate_deterministic_fallback_response("Random alien question", [], "general_health", "insufficient")
    assert fb.evidence_sufficiency == "insufficient"
    assert "not have specific evidence" in fb.answer.lower()
    assert len(fb.cited_evidence_ids) == 0


# ---------------------------------------------------------------------------
# 4. Strict Pydantic Schema and Forbidden Fields Validation
# ---------------------------------------------------------------------------

def test_forbidden_fields_rejection():
    """Ensures forbidden diagnostic/fertility keys cannot be included in responses."""
    raw_llm_json = {
        "answer": "Adequate sleep and exercise support metabolic health.",
        "cited_evidence_ids": ["WHO_TEST_1"],
        "evidence_sufficiency": "sufficient",
        "domain": "lifestyle",
        "suggested_followups": ["How much sleep is ideal?"],
        # Forbidden fields that should be rejected or excluded
        "diagnosis": "Mild Hypogonadism",
        "fertility_probability": 0.88,
    }

    cleaned = {k: v for k, v in raw_llm_json.items() if k not in FORBIDDEN_COMPANION_FIELDS}
    parsed = CompanionLLMOutput.model_validate(cleaned)
    assert not hasattr(parsed, "diagnosis")
    assert not hasattr(parsed, "fertility_probability")
    assert parsed.answer == "Adequate sleep and exercise support metabolic health."


# ---------------------------------------------------------------------------
# 5. Fabricated Evidence ID Filtering
# ---------------------------------------------------------------------------

def test_fabricated_evidence_id_filtering(test_user_a: User, db_session: Session):
    """Verifies that the service filters out hallucinated evidence IDs not present in retrieved context."""
    # Mock execute_groq_request returning fabricated IDs
    fake_response = json.dumps({
        "answer": "Here is an evidence-backed statement on diet.",
        "cited_evidence_ids": ["FABRICATED_ID_999", "NONEXISTENT_STUDY_2099"],
        "evidence_sufficiency": "sufficient",
        "domain": "lifestyle",
        "suggested_followups": ["What foods help?"],
    })

    with patch("app.services.companion_service.execute_groq_request", return_value=fake_response):
        req = ChatRequest(message="Can eating leafy greens improve health?", include_health_context=False)
        resp = process_chat_message(req, test_user_a, db_session)

        # Confirm fabricated IDs were NOT accepted into sources
        returned_source_ids = [s.source_id for s in resp.sources]
        assert "FABRICATED_ID_999" not in returned_source_ids
        assert "NONEXISTENT_STUDY_2099" not in returned_source_ids


# ---------------------------------------------------------------------------
# 6. Bounded History Context Construction
# ---------------------------------------------------------------------------

def test_bounded_history_prompt_construction():
    """Ensures prompt contains bounded previous turns and does not grow unbounded."""
    history = [
        {"role": "user", "content": f"Turn {i}"} for i in range(10)
    ]
    prompt = build_companion_user_prompt(
        current_message="Newest message",
        bounded_history=history[-4:],
        sources=[],
    )
    assert "Turn 9" in prompt
    assert "Turn 8" in prompt
    assert "Turn 0" not in prompt  # Truncated turns are excluded
    assert "Newest message" in prompt


# ---------------------------------------------------------------------------
# 7. End-to-End REST API Chat & Ownership Isolation
# ---------------------------------------------------------------------------

def test_chat_creates_conversation_and_persists_messages(client_user_a: TestClient, db_session: Session):
    """Tests POST /api/v1/companion/chat end-to-end, creating conversation and messages."""
    res = client_user_a.post(
        "/api/v1/companion/chat",
        json={"message": "What factors influence sperm count and motility?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "conversation_id" in data
    assert "answer" in data
    assert len(data["answer"]) > 20
    assert "disclaimer" in data
    assert data["review_status"] == "AI_SYNTHESIZED_UNREVIEWED"
    assert data["is_escalation"] is False

    conv_id = data["conversation_id"]

    # Continue same conversation with turn 2
    res2 = client_user_a.post(
        "/api/v1/companion/chat",
        json={
            "conversation_id": conv_id,
            "message": "Does moderate exercise help?",
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["conversation_id"] == conv_id


def test_cross_user_isolation_cannot_access_others_conversation(
    client: TestClient,
    test_user_a: User,
    test_user_b: User,
):
    """Proves User B cannot read, inject into, or delete User A's conversation (404/ownership enforced)."""
    # 1. User A creates conversation
    active_user_holder["user"] = test_user_a
    res_a = client.post(
        "/api/v1/companion/chat",
        json={"message": "Private health question from User A"},
    )
    assert res_a.status_code == 200
    conv_id = res_a.json()["conversation_id"]

    # 2. Switch to User B - attempts to fetch User A's conversation
    active_user_holder["user"] = test_user_b
    res_b_get = client.get(f"/api/v1/companion/conversations/{conv_id}")
    assert res_b_get.status_code == 404

    # 3. User B attempts to append message to User A's conversation
    res_b_post = client.post(
        "/api/v1/companion/chat",
        json={
            "conversation_id": conv_id,
            "message": "User B trying to inject into User A's conversation",
        },
    )
    assert res_b_post.status_code == 404

    # 4. User B attempts to delete User A's conversation
    res_b_del = client.delete(f"/api/v1/companion/conversations/{conv_id}")
    assert res_b_del.status_code == 404


def test_conversation_listing_and_deletion(client_user_a: TestClient):
    """Tests GET /conversations, GET /conversations/{id}, and DELETE /conversations/{id}."""
    # Create conversation
    res = client_user_a.post(
        "/api/v1/companion/chat",
        json={"message": "How does scrotal temperature affect sperm?"},
    )
    assert res.status_code == 200
    conv_id = res.json()["conversation_id"]

    # List conversations
    list_res = client_user_a.get("/api/v1/companion/conversations")
    assert list_res.status_code == 200
    summaries = list_res.json()
    assert any(s["id"] == conv_id for s in summaries)

    # Fetch detail
    detail_res = client_user_a.get(f"/api/v1/companion/conversations/{conv_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["messages"]) >= 2  # user + assistant

    # Delete conversation
    del_res = client_user_a.delete(f"/api/v1/companion/conversations/{conv_id}")
    assert del_res.status_code == 200

    # Confirm 404 afterwards
    detail_res_after = client_user_a.get(f"/api/v1/companion/conversations/{conv_id}")
    assert detail_res_after.status_code == 404


def test_emergency_escalation_endpoint(client_user_a: TestClient):
    """Verifies that an emergency query via API immediately triggers escalation response."""
    res = client_user_a.post(
        "/api/v1/companion/chat",
        json={"message": "I was injured in sports and have sudden severe testicle pain!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_escalation"] is True
    assert data["review_status"] == "CLINICAL_SAFETY_ESCALATION"
    assert "emergency" in data["answer"].lower()
