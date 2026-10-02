"""
Unit and Integration Tests for Evidence & Resources Router
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_list_all_evidence_documents():
    response = client.get("/api/v1/evidence")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 6

    # Verify structure of first document
    first = data[0]
    assert "id" in first
    assert "title" in first
    assert "organization" in first
    assert "publication_year" in first
    assert "evidence_type" in first
    assert "url" in first
    assert "source_identifier" in first
    assert "summary" in first
    assert "chunks" in first
    assert len(first["chunks"]) > 0


def test_get_evidence_by_id():
    response = client.get("/api/v1/evidence/who-infertility-2024")
    assert response.status_code == 200
    doc = response.json()
    assert doc["id"] == "who-infertility-2024"
    assert "World Health Organization" in doc["organization"]
    assert doc["publication_year"] == 2024
    assert len(doc["chunks"]) >= 2


def test_get_nonexistent_evidence_returns_404():
    response = client.get("/api/v1/evidence/nonexistent-doc-9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_filter_evidence_by_topic():
    response = client.get("/api/v1/evidence?topic=reproductive_health")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    # Every returned doc must have reproductive_health in its domains or relevant tags
    for doc in data:
        assert "reproductive_health" in doc["domains"] or any("reproductive" in t or "infertility" in t or "varicocele" in t for t in doc["evidence_tags"])


def test_search_evidence():
    response = client.get("/api/v1/evidence?q=varicocele")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any("aua-asrm" in doc["id"] for doc in data)


def test_get_evidence_stats():
    response = client.get("/api/v1/evidence/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_documents"] >= 6
    assert stats["total_chunks"] >= 10
    assert len(stats["domain_counts"]) >= 6
    for dom in stats["domain_counts"]:
        assert "domain_id" in dom
        assert "domain_label" in dom
        assert "document_count" in dom
        assert "chunk_count" in dom
