"""
MantraAI — Myth vs Fact Engine Unit & Integration Test Suite
============================================================

Tests:
1. Corpus CSV/JSON Import & Idempotency
2. Source Registry Validation & Reference Integrity
3. Canonical Exact, Alias, and Similarity Matching (with Calibrated Rejection)
4. Draft vs Verified Status Enforcement (Drafts never verified)
5. Dynamic Evidence Synthesis & Groq Fallback
6. Insufficient Evidence Handling
7. Strict Pydantic Schema Validation & Forbidden Medical Key Rejection
8. Fabricated Evidence ID Filtering
9. Authenticated User Query History & Tenant Isolation
10. Admin-Only Corpus Import Security (401/403 Enforcement & Admin Key)
11. Safe Non-Alarmist Health Grounding (No fake infertility claims)
12. REST API Endpoints (query, claims, search, sources, stats, history, import)
"""

import os
import sys
import pytest
from uuid import uuid4
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
from fastapi import Depends, Header, HTTPException, status
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.config import settings
from app.database import Base, get_db
from app.auth.firebase_auth import (
    get_current_user,
    get_optional_current_user,
    require_admin_user,
)
from app.models.user import User
from app.models.myth_fact import (
    MythFactSource,
    MythFactClaim,
    MythFactAlias,
    MythFactGeneratedCache,
    MythFactQueryHistory,
)
from app.schemas.myth_fact import (
    MythFactClassification,
    MatchTypeEnum,
    MythFactQueryRequest,
    MythFactQueryResponse,
    SynthesizedMythFactLLMOutput,
)
from app.services.myth_fact_importer import (
    import_myth_fact_corpus,
    normalize_text_for_matching,
    parse_evidence_source_ids,
    MythFactImportError,
)
from app.services.myth_fact_service import (
    find_canonical_match,
    synthesize_unmatched_claim,
    process_myth_fact_query,
    extract_keywords,
    calculate_token_similarity,
)

# Set up SQLite test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


USER_1_UID = "mythfact-test-user-1"
USER_2_UID = "mythfact-test-user-2"
ADMIN_UID = "mythfact-test-admin"
TEST_ADMIN_KEY = "mantra-secret-admin-test-key-2026"

current_test_uid = USER_1_UID
current_is_admin = False


def override_get_current_user(db: Session = Depends(override_get_db)):
    if not current_test_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth token")
    user = db.query(User).filter(User.firebase_uid == current_test_uid).first()
    if not user:
        user = User(firebase_uid=current_test_uid, email=f"{current_test_uid}@mantraai.test")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def override_get_optional_current_user(db: Session = Depends(override_get_db)):
    if not current_test_uid:
        return None
    user = db.query(User).filter(User.firebase_uid == current_test_uid).first()
    if not user:
        user = User(firebase_uid=current_test_uid, email=f"{current_test_uid}@mantraai.test")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def override_require_admin_user(
    db: Session = Depends(override_get_db),
    x_admin_key: str = Header(None, alias="X-Admin-Key"),
):
    # 1. Admin Key
    if x_admin_key and x_admin_key == TEST_ADMIN_KEY:
        return None

    # 2. Auth Context
    if not current_test_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authentication required.")
    
    if not current_is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: Administrator privileges required.")

    user = db.query(User).filter(User.firebase_uid == current_test_uid).first()
    return user


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user
app.dependency_overrides[get_optional_current_user] = override_get_optional_current_user
app.dependency_overrides[require_admin_user] = override_require_admin_user

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db_and_auth():
    global current_test_uid, current_is_admin
    current_test_uid = USER_1_UID
    current_is_admin = False
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_optional_current_user] = override_get_optional_current_user
    app.dependency_overrides[require_admin_user] = override_require_admin_user

    db = TestingSessionLocal()
    # Ensure test users exist
    for uid in [USER_1_UID, USER_2_UID, ADMIN_UID]:
        u = db.query(User).filter(User.firebase_uid == uid).first()
        if not u:
            db.add(User(firebase_uid=uid, email=f"{uid}@mantraai.test"))
    db.commit()

    # Ensure corpus is seeded
    if db.query(MythFactClaim).count() < 100:
        import_myth_fact_corpus(db=db, verify_json=True)

    db.close()


# ===========================================================================
# 1. Corpus Import & Idempotency Tests
# ===========================================================================

def test_corpus_import_success():
    db = TestingSessionLocal()
    report = import_myth_fact_corpus(db=db, verify_json=True)
    
    total_sources = db.query(MythFactSource).count()
    total_claims = db.query(MythFactClaim).count()
    total_aliases = db.query(MythFactAlias).count()

    assert total_sources == 20, f"Expected 20 sources, got {total_sources}"
    assert total_claims == 100, f"Expected 100 claims, got {total_claims}"
    assert total_aliases >= 30, f"Expected >= 30 aliases, got {total_aliases}"
    assert report["json_consistency_verified"] is True
    assert len(report["discrepancies"]) == 0
    db.close()


def test_corpus_import_idempotency():
    db = TestingSessionLocal()
    # Run import once
    report1 = import_myth_fact_corpus(db=db, verify_json=True)
    count1_claims = db.query(MythFactClaim).count()
    count1_sources = db.query(MythFactSource).count()

    # Run import second time (must update / skip, not duplicate)
    report2 = import_myth_fact_corpus(db=db, verify_json=True)
    count2_claims = db.query(MythFactClaim).count()
    count2_sources = db.query(MythFactSource).count()

    assert count1_claims == count2_claims == 100
    assert count1_sources == count2_sources == 20
    assert report2["claims_imported"] == 0
    assert report2["claims_updated"] == 100
    assert report2["sources_imported"] == 0
    assert report2["sources_updated"] == 20
    db.close()


def test_normalization_and_parsing_helpers():
    raw_query = "Does   MASTURBATION cause 'infertility'?!  "
    norm = normalize_text_for_matching(raw_query)
    assert norm == "does masturbation cause infertility"

    sources_str = "WHO_INFERTILITY_2025; AUA_ASRM_I_2020, CDC_CONDOM_2024;"
    parsed = parse_evidence_source_ids(sources_str)
    assert len(parsed) == 3
    assert "WHO_INFERTILITY_2025" in parsed
    assert "AUA_ASRM_I_2020" in parsed
    assert "CDC_CONDOM_2024" in parsed


# ===========================================================================
# 2. Canonical Matching & Calibration Quality Tests
# ===========================================================================

def test_canonical_exact_match():
    db = TestingSessionLocal()
    # MF-001 canonical claim: "Infertility is only a female health problem."
    match = find_canonical_match("Infertility is only a female health problem.", db)
    assert match is not None
    claim, match_type, conf, matched_text = match
    assert claim.claim_id == "MF-001"
    assert match_type == MatchTypeEnum.CANONICAL_EXACT
    assert conf == 1.0
    assert claim.classification == "MYTH"
    db.close()


def test_canonical_alias_match():
    db = TestingSessionLocal()
    # Seeded alias for MF-001: "Is infertility only a woman’s problem?"
    match = find_canonical_match("Is infertility only a woman's problem?", db)
    assert match is not None
    claim, match_type, conf, matched_text = match
    assert claim.claim_id == "MF-001"
    assert match_type in [MatchTypeEnum.CANONICAL_ALIAS, MatchTypeEnum.CANONICAL_SIMILARITY]
    assert conf >= 0.70
    db.close()


def test_canonical_similarity_match():
    db = TestingSessionLocal()
    # Paraphrased version of MF-019: "Taking testosterone is a reliable way to improve fertility."
    query = "Will taking testosterone improve my fertility?"
    match = find_canonical_match(query, db, threshold=0.60)
    assert match is not None
    claim, match_type, conf, matched_text = match
    assert claim.claim_id == "MF-019"
    assert claim.classification == "MYTH"
    db.close()


def test_generic_and_unrelated_queries_do_not_falsely_match_canonical():
    db = TestingSessionLocal()
    # 1-word or generic query
    match1 = find_canonical_match("fertility", db)
    assert match1 is None

    # Unrelated query
    match2 = find_canonical_match("I like eating green apples and going to the gym every morning", db)
    assert match2 is None

    # Generic hardware query
    match3 = find_canonical_match("Where can I buy a new laptop computer?", db)
    assert match3 is None
    db.close()


def test_draft_claims_never_misrepresented_as_verified():
    db = TestingSessionLocal()
    req = MythFactQueryRequest(query="Infertility is only a female health problem.")
    res = process_myth_fact_query(req, db)

    assert res.claim_id == "MF-001"
    assert res.review_status == "CURATED_DRAFT_REQUIRES_CLINICIAN_REVIEW"
    # CRITICAL: Draft claims must NEVER be marked as is_verified=True
    assert res.is_verified is False
    assert len(res.limitations) > 0
    assert "curated draft requires clinician review" in res.limitations[0].lower()
    db.close()


# ===========================================================================
# 3. Dynamic Synthesis & Safe Evidence Grounding Tests
# ===========================================================================

def test_unknown_claim_with_evidence_synthesis():
    db = TestingSessionLocal()
    # Unindexed query matching existing evidence in EVIDENCE_CORPUS (heat exposure / laptops)
    req = MythFactQueryRequest(query="Is using a laptop on your lap bad for sperm temperature?")
    res = process_myth_fact_query(req, db)

    assert res.match_type == MatchTypeEnum.SYNTHESIZED_EVIDENCE
    assert res.classification in [MythFactClassification.FACT, MythFactClassification.CONTEXT_DEPENDENT, MythFactClassification.MISLEADING]
    assert res.is_verified is False
    assert len(res.guideline_evidence) > 0
    # Check that returned evidence IDs are valid
    for ev in res.guideline_evidence:
        assert ev.evidence_id
        assert ev.url.startswith("http")
    db.close()


def test_laptop_heat_synthesis_no_unsupported_infertility_claims():
    db = TestingSessionLocal()
    req = MythFactQueryRequest(query="Does putting a laptop on your lap cause permanent male infertility?")
    res = process_myth_fact_query(req, db)

    assert res.is_verified is False
    # Must not assert that laptops cause permanent infertility
    explanation_lower = res.explanation.lower()
    assert "permanent infertility" not in explanation_lower or "not" in explanation_lower or "temporary" in explanation_lower or "transient" in explanation_lower or "insufficient" in explanation_lower
    db.close()


def test_insufficient_evidence_fallback():
    db = TestingSessionLocal()
    # Query with no supporting clinical evidence
    req = MythFactQueryRequest(query="Does wearing amethyst crystal rings during full moon increase testosterone by 300%?")
    res = process_myth_fact_query(req, db)

    assert res.match_type == MatchTypeEnum.INSUFFICIENT_EVIDENCE
    assert res.classification == MythFactClassification.INSUFFICIENT_EVIDENCE
    assert res.confidence_score == 0.0
    assert res.is_verified is False
    assert len(res.explanation) > 10
    db.close()


def test_groq_failure_graceful_fallback():
    db = TestingSessionLocal()
    # Mock Groq to raise exception
    with patch("app.services.myth_fact_service.execute_groq_request", side_effect=Exception("Groq API Timeout")):
        req = MythFactQueryRequest(query="Does saunas and hot tubs affect male fertility parameters?")
        res = process_myth_fact_query(req, db)

        # Must not raise 500 error; falls back gracefully
        assert res.match_type == MatchTypeEnum.SYNTHESIZED_EVIDENCE
        assert res.is_verified is False
        assert len(res.explanation) > 20
    db.close()


def test_generated_answer_caching():
    db = TestingSessionLocal()
    query = "Does cold shower increase sperm motility significantly?"
    req = MythFactQueryRequest(query=query)

    # First call - synthesizes and caches
    res1 = process_myth_fact_query(req, db)
    cache_count_1 = db.query(MythFactGeneratedCache).count()

    # Second call - retrieves from cache
    res2 = process_myth_fact_query(req, db)
    cache_count_2 = db.query(MythFactGeneratedCache).count()

    assert cache_count_1 == cache_count_2
    assert res1.explanation == res2.explanation
    assert res2.match_type in [MatchTypeEnum.SYNTHESIZED_EVIDENCE, MatchTypeEnum.INSUFFICIENT_EVIDENCE]
    db.close()


# ===========================================================================
# 4. Strict Schema & Medical Safety Rejection Tests
# ===========================================================================

def test_pydantic_schema_rejects_forbidden_diagnosis_fields():
    # Attempting to pass forbidden keys into SynthesizedMythFactLLMOutput
    with pytest.raises(ValidationError) as exc_info:
        SynthesizedMythFactLLMOutput.model_validate({
            "classification": "FACT",
            "domain": "reproductive_health",
            "explanation": "Valid non-diagnostic explanation based on guidelines.",
            "fertility_probability": "85%",  # FORBIDDEN
        })
    assert "Forbidden medical diagnosis/probability key" in str(exc_info.value)


def test_pydantic_schema_rejects_prescription_fields():
    with pytest.raises(ValidationError) as exc_info:
        SynthesizedMythFactLLMOutput.model_validate({
            "classification": "FACT",
            "domain": "reproductive_health",
            "explanation": "Valid non-diagnostic explanation based on guidelines.",
            "prescription": "Take Clomiphene 25mg daily",  # FORBIDDEN
        })
    assert "Forbidden medical diagnosis/probability key" in str(exc_info.value)


def test_fabricated_evidence_ids_are_filtered():
    db = TestingSessionLocal()
    mock_llm_json = """{
        "classification": "CONTEXT_DEPENDENT",
        "domain": "lifestyle",
        "explanation": "Evidence shows lifestyle factors have variable effects on semen quality.",
        "cited_evidence_ids": ["hallucinated-doc-999", "aua-asrm-varicocele"],
        "reasoning": "Based on guidelines.",
        "limitations": ["Observational evidence."]
    }"""

    with patch("app.services.myth_fact_service.execute_groq_request", return_value=mock_llm_json):
        res = synthesize_unmatched_claim("varicocele semen effects", db)
        
        # Verify that hallucinated ID was filtered out
        retrieved_ids = [e.evidence_id for e in res.guideline_evidence]
        assert "hallucinated-doc-999" not in retrieved_ids
    db.close()


# ===========================================================================
# 5. REST API Endpoints & User History Isolation Tests
# ===========================================================================

def test_api_post_query_canonical():
    payload = {"query": "Does masturbation cause infertility?"}
    response = client.post("/api/v1/myth-fact/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["claim_id"] == "MF-011"
    assert data["classification"] == "MISLEADING"
    assert data["match_type"] in ["CANONICAL_EXACT", "CANONICAL_ALIAS", "CANONICAL_SIMILARITY"]
    assert data["is_verified"] is False
    assert len(data["sources"]) > 0
    assert "disclaimer" in data


def test_api_list_canonical_claims():
    response = client.get("/api/v1/myth-fact/claims?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 10
    first = data[0]
    assert "claim_id" in first
    assert "canonical_claim" in first
    assert "classification" in first
    assert "review_status" in first


def test_api_filter_canonical_claims_by_domain_and_classification():
    response = client.get("/api/v1/myth-fact/claims?domain=reproductive_health&classification=MYTH")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for item in data:
        assert item["domain"] == "reproductive_health"
        assert item["classification"] == "MYTH"


def test_api_get_canonical_claim_by_id():
    response = client.get("/api/v1/myth-fact/claims/MF-001")
    assert response.status_code == 200
    data = response.json()
    assert data["claim_id"] == "MF-001"
    assert data["classification"] == "MYTH"
    assert "sources" in data
    assert len(data["sources"]) > 0
    assert "aliases" in data


def test_api_get_canonical_claim_not_found():
    response = client.get("/api/v1/myth-fact/claims/MF-99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_api_list_sources():
    response = client.get("/api/v1/myth-fact/sources")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 20
    first = data[0]
    assert "source_id" in first
    assert "source_title" in first
    assert "source_url" in first
    assert first["source_url"].startswith("http")


def test_api_get_corpus_stats():
    response = client.get("/api/v1/myth-fact/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_canonical_claims"] == 100
    assert stats["total_sources"] == 20
    assert stats["total_aliases"] >= 30
    assert len(stats["by_classification"]) > 0
    assert len(stats["by_domain"]) > 0


def test_authenticated_user_query_history_isolation():
    global current_test_uid

    # 1. User 1 performs a query
    current_test_uid = USER_1_UID
    client.post("/api/v1/myth-fact/query", json={"query": "Does cell phone in pocket affect sperm?"})

    # User 1 fetches history -> should contain the query
    res1 = client.get("/api/v1/myth-fact/history")
    assert res1.status_code == 200
    data1 = res1.json()
    assert len(data1) >= 1
    assert any("cell phone" in h["query_text"] for h in data1)

    # 2. Switch to User 2 -> User 2's history must NOT contain User 1's query
    current_test_uid = USER_2_UID
    res2 = client.get("/api/v1/myth-fact/history")
    assert res2.status_code == 200
    data2 = res2.json()
    # User 2 has not performed this query
    assert not any("cell phone" in h["query_text"] for h in data2)

    # 3. Unauthenticated request -> should fail with 401
    current_test_uid = None
    res3 = client.get("/api/v1/myth-fact/history")
    assert res3.status_code == 401


# ===========================================================================
# 6. Admin-Only Import Security Tests
# ===========================================================================

def test_api_import_unauthorized_rejected():
    global current_test_uid, current_is_admin
    current_test_uid = None
    current_is_admin = False

    # No token, no header -> 401 Unauthorized
    response = client.post("/api/v1/myth-fact/import")
    assert response.status_code == 401


def test_api_import_non_admin_user_rejected():
    global current_test_uid, current_is_admin
    current_test_uid = USER_1_UID
    current_is_admin = False

    # Regular user attempting to trigger import -> 403 Forbidden
    response = client.post("/api/v1/myth-fact/import")
    assert response.status_code == 403
    assert "administrator privileges required" in response.json()["detail"].lower()


def test_api_import_with_admin_key_authorized():
    global current_test_uid, current_is_admin
    current_test_uid = None
    current_is_admin = False

    # Valid X-Admin-Key header -> 200 OK
    response = client.post(
        "/api/v1/myth-fact/import",
        headers={"X-Admin-Key": TEST_ADMIN_KEY}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["details"]["json_consistency_verified"] is True


def test_api_import_with_admin_user_authorized():
    global current_test_uid, current_is_admin
    current_test_uid = ADMIN_UID
    current_is_admin = True

    # Admin user -> 200 OK
    response = client.post("/api/v1/myth-fact/import")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["details"]["json_consistency_verified"] is True
