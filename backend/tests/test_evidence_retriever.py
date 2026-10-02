"""
Tests for app/services/evidence_retriever.py
=============================================

PURPOSE
-------
Verifies deterministic tag-matching, provenance preservation, top-k limits,
deduplication, and integration with the Health Domain & Context Engine.

All tests use synthetic / mock test queries and canonical evidence metadata only.
No real patient or clinical data is used.

COVERAGE:
  1.  Empty tags handling
  2.  Unknown / unmapped tags handling
  3.  Single-tag retrieval
  4.  Multiple-tag retrieval
  5.  Top-K limit behavior
  6.  Deterministic ordering (identical tags produce identical order)
  7.  Correct tag matching verification
  8.  Correct provenance preservation (title, organization, year, url, identifier)
  9.  No fabricated URLs (all URLs start with valid https:// and match official bodies)
  10. Evidence item contains complete source metadata
  11. Missing / None input tags handled safely
  12. Duplicate evidence prevention / deduplication
  13. Reproductive-health retrieval (varicocele, evaluation, etc.)
  14. Lifestyle retrieval (sleep, diet, physical activity)
  15. Environmental & heat retrieval (hyperthermia, pesticides, metals, plastics)
  16. Mental wellness & stress retrieval (performance anxiety, spectatoring)
  17. Sexual health & digital habits retrieval
  18. Substance & medication retrieval (anabolic steroids, finasteride)
  19. Context-engine -> evidence retrieval end-to-end integration
  20. No evidence item is returned without complete provenance
"""

import sys
import os
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.normalizer import normalize_assessment_responses
from app.services.context_engine import build_health_context
from app.services.evidence_corpus import EVIDENCE_CORPUS
from app.services.evidence_retriever import (
    retrieve_evidence,
    retrieve_evidence_for_health_context,
    EvidenceContext,
    EvidenceItem,
)


# ===========================================================================
# 1. Empty tags handling
# ===========================================================================
def test_empty_tags_returns_empty_context():
    """Passing an empty list of evidence tags returns an empty EvidenceContext safely."""
    res = retrieve_evidence([])
    assert isinstance(res, EvidenceContext)
    assert res.matched_count == 0
    assert len(res.items) == 0
    assert res.query_tags == []
    assert res.domain_distribution == {}


# ===========================================================================
# 2. Unknown tags handling
# ===========================================================================
def test_unknown_tags_returns_empty_context():
    """Tags not matching any guideline chunks return 0 items without throwing exceptions."""
    res = retrieve_evidence(["non_existent_medical_tag_xyz", "unknown_12345"])
    assert res.matched_count == 0
    assert len(res.items) == 0
    assert len(res.query_tags) == 2


# ===========================================================================
# 3. Single-tag retrieval
# ===========================================================================
def test_single_tag_retrieval():
    """Querying a single canonical tag retrieves the relevant guideline."""
    res = retrieve_evidence(["varicocele"])
    assert res.matched_count >= 1
    top_item = res.items[0]
    assert "varicocele" in top_item.matched_tags
    assert "AUA/ASRM" in top_item.source or "EAU" in top_item.source


# ===========================================================================
# 4. Multiple-tag retrieval
# ===========================================================================
def test_multiple_tag_retrieval():
    """Querying multiple tags matches across multiple domains."""
    tags = ["varicocele", "hyperthermia", "sleep_duration", "anabolic_steroids"]
    res = retrieve_evidence(tags, top_k=6)
    assert res.matched_count >= 3
    retrieved_doc_ids = [item.document_id for item in res.items]
    assert "aua-asrm-part1-2020" in retrieved_doc_ids or "aua-asrm-part2-2020" in retrieved_doc_ids
    assert "eau-repro-2024" in retrieved_doc_ids or "env-lifestyle-review-2022" in retrieved_doc_ids


# ===========================================================================
# 5. Top-K limit behavior
# ===========================================================================
def test_top_k_limit():
    """The returned items count must never exceed top_k."""
    tags = [
        "varicocele", "hyperthermia", "sleep_duration", "anabolic_steroids",
        "tobacco", "pesticides", "spectatoring", "semen_analysis"
    ]
    res_2 = retrieve_evidence(tags, top_k=2)
    assert len(res_2.items) == 2

    res_4 = retrieve_evidence(tags, top_k=4)
    assert len(res_4.items) == 4


# ===========================================================================
# 6. Deterministic ordering
# ===========================================================================
def test_deterministic_ordering():
    """Repeated calls with identical tags produce identical item order."""
    tags = ["varicocele", "anabolic_steroids", "hyperthermia", "spectatoring"]
    res1 = retrieve_evidence(tags, top_k=5)
    res2 = retrieve_evidence(tags, top_k=5)

    assert [item.evidence_id for item in res1.items] == [item.evidence_id for item in res2.items]
    assert res1.model_dump_json() == res2.model_dump_json()


# ===========================================================================
# 7. Correct tag matching
# ===========================================================================
def test_correct_tag_matching():
    """Every returned item must list only the tags that actually matched the query."""
    query = ["tobacco", "nicotine"]
    res = retrieve_evidence(query)
    assert res.matched_count >= 1
    for item in res.items:
        for t in item.matched_tags:
            assert t in query


# ===========================================================================
# 8. Correct provenance preservation
# ===========================================================================
def test_provenance_preservation():
    """All items must have valid title, organization, year, url, and source identifier."""
    res = retrieve_evidence(["anabolic_steroids", "semen_analysis", "hyperthermia"], top_k=5)
    assert res.matched_count >= 1
    for item in res.items:
        assert item.title != ""
        assert item.organization != ""
        assert item.publication_year is not None and item.publication_year >= 2000
        assert item.url.startswith("https://")
        assert len(item.source_identifier) > 3
        assert len(item.excerpt) > 20


# ===========================================================================
# 9. No fabricated URLs
# ===========================================================================
def test_no_fabricated_urls():
    """Every URL in the corpus must match recognized medical and scientific publishing domains."""
    valid_domains = [
        "who.int",
        "asrm.org",
        "uroweb.org",
        "pubmed.ncbi.nlm.nih.gov",
    ]
    for doc in EVIDENCE_CORPUS:
        assert any(domain in doc.url for domain in valid_domains), f"Invalid or unexpected URL domain: {doc.url}"


# ===========================================================================
# 10. Evidence item contains complete source metadata
# ===========================================================================
def test_complete_source_metadata():
    """Every retrieved item has document_type and limitations."""
    res = retrieve_evidence(["pesticides", "heavy_metals"])
    assert res.matched_count >= 1
    for item in res.items:
        assert item.document_type in ["guideline", "systematic_review", "consensus"]
        assert isinstance(item.limitations, list)
        assert len(item.limitations) >= 1


# ===========================================================================
# 11. Missing / None input tags handled safely
# ===========================================================================
def test_none_and_invalid_input_tags():
    """None or non-string items inside tags list are handled safely."""
    res = retrieve_evidence(None)
    assert res.matched_count == 0

    res2 = retrieve_evidence(["", "  ", None, "varicocele"])
    assert res2.matched_count >= 1
    assert "varicocele" in res2.query_tags


# ===========================================================================
# 12. Duplicate evidence prevention / deduplication
# ===========================================================================
def test_duplicate_evidence_prevention():
    """Multiple matching tags should not produce duplicate chunk items in the result."""
    tags = ["varicocele", "varicocele_screening", "venous_stasis", "urology_consultation"]
    res = retrieve_evidence(tags, top_k=10)
    evidence_ids = [item.evidence_id for item in res.items]
    assert len(evidence_ids) == len(set(evidence_ids))


# ===========================================================================
# 13. Reproductive-health retrieval
# ===========================================================================
def test_reproductive_health_retrieval():
    """Reproductive health tags retrieve WHO or AUA/ASRM guidelines."""
    res = retrieve_evidence(["male_infertility_evaluation", "varicocele", "mumps_orchitis"])
    assert res.matched_count >= 1
    sources = [item.source for item in res.items]
    assert any("AUA/ASRM" in s or "WHO" in s for s in sources)


# ===========================================================================
# 14. Lifestyle retrieval
# ===========================================================================
def test_lifestyle_retrieval():
    """Lifestyle tags retrieve sleep, physical activity, and nutrition evidence."""
    res = retrieve_evidence(["sleep_duration", "circadian_rhythm", "dietary_antioxidants"])
    assert res.matched_count >= 1
    excerpts = " ".join([item.excerpt for item in res.items])
    assert "sleep" in excerpts.lower() or "circadian" in excerpts.lower() or "nutrition" in excerpts.lower()


# ===========================================================================
# 15. Environmental & heat retrieval
# ===========================================================================
def test_environmental_heat_retrieval():
    """Environmental and heat tags retrieve hyperthermia, pesticide, or plastics evidence."""
    res = retrieve_evidence(["hyperthermia", "device_heat", "pesticides", "bisphenol_a"])
    assert res.matched_count >= 1
    excerpts = " ".join([item.excerpt for item in res.items])
    assert "temperature" in excerpts.lower() or "pesticide" in excerpts.lower() or "plastic" in excerpts.lower()


# ===========================================================================
# 16. Mental wellness & stress retrieval
# ===========================================================================
def test_mental_wellness_retrieval():
    """Psychological stress and spectatoring tags retrieve psychosexual evidence."""
    res = retrieve_evidence(["performance_anxiety", "spectatoring", "autonomic_balance"])
    assert res.matched_count >= 1
    item = res.items[0]
    assert "psychosexual" in item.document_id or "spectatoring" in item.excerpt.lower()


# ===========================================================================
# 17. Sexual health & digital habits retrieval
# ===========================================================================
def test_sexual_health_digital_habits_retrieval():
    """Digital habits and behavioral control tags retrieve psychosexual review evidence."""
    res = retrieve_evidence(["digital_habits", "behavioral_control", "media_expectations"])
    assert res.matched_count >= 1
    item = res.items[0]
    assert "digital" in item.excerpt.lower() or "media" in item.excerpt.lower()


# ===========================================================================
# 18. Substance & medication retrieval
# ===========================================================================
def test_substance_medication_retrieval():
    """Anabolic steroids and Finasteride tags retrieve AUA/ASRM or EAU medication chunks."""
    res = retrieve_evidence(["anabolic_steroids", "hypogonadotropic_hypogonadism", "finasteride"])
    assert res.matched_count >= 1
    titles = [item.title for item in res.items]
    assert any("Infertility in Men" in t or "EAU Guidelines" in t for t in titles)


# ===========================================================================
# 19. Context-engine -> evidence retrieval end-to-end integration
# ===========================================================================
def test_context_engine_to_evidence_integration():
    """End-to-end integration: raw questionnaire -> normalizer -> context engine -> evidence retriever."""
    raw = {
        "known_varicocele": "Yes",
        "anabolic_steroid_use": "Current",
        "laptop_on_lap": "Daily",
        "sleep_duration": "<5",
        "smoking_status": "Regular",
        "anticipatory_anxiety_before_sex": "Always",
        "cognitive_self_monitoring_during_sex": "Totally agree",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    assert len(ctx.modifiable_factors) >= 3
    assert len(ctx.follow_up_flags) >= 2

    evidence = retrieve_evidence_for_health_context(ctx, top_k=6)
    assert isinstance(evidence, EvidenceContext)
    assert evidence.matched_count >= 4
    assert len(evidence.items) <= 6

    # Verify that diverse domains are represented in the retrieved guidelines
    matched_doc_ids = {item.document_id for item in evidence.items}
    assert len(matched_doc_ids) >= 2

    # Verify all items have limitations and provenance
    for item in evidence.items:
        assert item.url.startswith("https://")
        assert len(item.matched_tags) >= 1
        assert len(item.limitations) >= 1


# ===========================================================================
# 20. No evidence item is returned without complete provenance
# ===========================================================================
def test_all_corpus_items_have_full_provenance():
    """Ensures every single document in the entire corpus contains full required provenance."""
    for doc in EVIDENCE_CORPUS:
        assert doc.id != ""
        assert doc.title != ""
        assert doc.source != ""
        assert doc.organization != ""
        assert doc.publication_year >= 2000
        assert doc.url.startswith("https://")
        assert doc.source_identifier != ""
        assert len(doc.evidence_tags) >= 1
        assert len(doc.chunks) >= 1
        assert len(doc.limitations) >= 1
