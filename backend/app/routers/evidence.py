"""
MantraAI — Authoritative Evidence & Resources Router
====================================================

PURPOSE
-------
Provides safe, read-only endpoints exposing authoritative evidence metadata,
clinical guideline summaries, publication provenance, and domain statistics.

SECURITY & SAFETY:
- Exposes only published metadata, plain-language summaries, and verified identifiers.
- Does NOT expose internal retrieval scores, prompts, or user data.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.evidence_corpus import EVIDENCE_CORPUS, DOCUMENT_MAP, EvidenceDocument, EvidenceChunk
from app.services.evidence_taxonomy import ALL_CANONICAL_TAGS, get_tag_domain

router = APIRouter(prefix="/api/v1/evidence", tags=["evidence"])


# ---------------------------------------------------------------------------
# Output Schemas
# ---------------------------------------------------------------------------

class EvidenceChunkOut(BaseModel):
    chunk_id: str
    document_id: str
    topic: str
    text: str
    evidence_tags: List[str]
    clinical_significance: Optional[str] = None
    limitations: List[str] = Field(default_factory=list)


class EvidenceDocumentOut(BaseModel):
    id: str
    title: str
    source: str
    organization: str
    publication_year: int
    document_type: str
    evidence_type: str  # Human-readable classification (e.g. "Clinical Guideline", "Systematic Review")
    url: str
    source_identifier: str  # DOI, PMID, or ISBN
    evidence_tags: List[str]
    domains: List[str]  # Mapped canonical domains
    primary_domain: str
    population_context: Optional[str] = None
    summary: str
    limitations: List[str] = Field(default_factory=list)
    chunks: List[EvidenceChunkOut] = Field(default_factory=list)
    chunk_count: int = 0


class DomainCount(BaseModel):
    domain_id: str
    domain_label: str
    document_count: int
    chunk_count: int


class EvidenceStatsOut(BaseModel):
    total_documents: int
    total_chunks: int
    domain_counts: List[DomainCount]


# ---------------------------------------------------------------------------
# Domain Display Mapping
# ---------------------------------------------------------------------------

DOMAIN_LABELS = {
    "reproductive_health": "Reproductive Health",
    "sexual_health": "Sexual Health",
    "mental_behavioral_wellness": "Mental & Behavioral Wellness",
    "lifestyle_wellness": "Lifestyle & Nutrition",
    "environmental_heat": "Environmental & Heat Exposure",
    "substance_medication": "Substance & Medication",
}

DOCUMENT_TYPE_LABELS = {
    "guideline": "Clinical Guideline",
    "systematic_review": "Systematic Review",
    "consensus": "Consensus Statement",
    "evidence_review": "Evidence Review",
    "research_study": "Research Study",
}


def _map_doc_to_out(doc: EvidenceDocument) -> EvidenceDocumentOut:
    # Determine all domains covered by doc tags
    doc_domains = list(dict.fromkeys(
        get_tag_domain(tag) for tag in doc.evidence_tags if get_tag_domain(tag)
    ))
    primary_domain = doc_domains[0] if doc_domains else "reproductive_health"
    evidence_type = DOCUMENT_TYPE_LABELS.get(doc.document_type.lower(), "Clinical Guideline")

    chunks_out = [
        EvidenceChunkOut(
            chunk_id=c.chunk_id,
            document_id=c.document_id,
            topic=c.topic,
            text=c.text,
            evidence_tags=c.evidence_tags,
            clinical_significance=c.clinical_significance,
            limitations=c.limitations,
        )
        for c in doc.chunks
    ]

    return EvidenceDocumentOut(
        id=doc.id,
        title=doc.title,
        source=doc.source,
        organization=doc.organization,
        publication_year=doc.publication_year,
        document_type=doc.document_type,
        evidence_type=evidence_type,
        url=doc.url,
        source_identifier=doc.source_identifier,
        evidence_tags=doc.evidence_tags,
        domains=doc_domains,
        primary_domain=primary_domain,
        population_context=doc.population_context,
        summary=doc.summary,
        limitations=doc.limitations,
        chunks=chunks_out,
        chunk_count=len(chunks_out),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[EvidenceDocumentOut])
def list_evidence_documents(
    topic: Optional[str] = Query(None, description="Filter by domain or tag"),
    q: Optional[str] = Query(None, description="Search query across title, organization, tags, summary"),
    doc_type: Optional[str] = Query(None, description="Filter by document type (e.g. guideline, systematic_review)"),
):
    """List all authoritative evidence documents with optional filtering and search."""
    results = [_map_doc_to_out(doc) for doc in EVIDENCE_CORPUS]

    # Filter by topic/domain
    if topic and topic.strip() and topic.lower() != "all":
        topic_clean = topic.strip().lower().replace(" ", "_")
        
        # Check if topic is a canonical domain or alias
        domain_aliases = {
            "reproductive": "reproductive_health",
            "reproductive_health": "reproductive_health",
            "sexual": "sexual_health",
            "sexual_health": "sexual_health",
            "mental": "mental_behavioral_wellness",
            "mental_behavioral": "mental_behavioral_wellness",
            "mental_&_behavioral": "mental_behavioral_wellness",
            "mental_behavioral_wellness": "mental_behavioral_wellness",
            "lifestyle": "lifestyle_wellness",
            "lifestyle_nutrition": "lifestyle_wellness",
            "lifestyle_&_nutrition": "lifestyle_wellness",
            "lifestyle_wellness": "lifestyle_wellness",
            "environmental": "environmental_heat",
            "environmental_exposure": "environmental_heat",
            "environmental_&_heat_exposure": "environmental_heat",
            "environmental_heat": "environmental_heat",
            "substance": "substance_medication",
            "substance_medication": "substance_medication",
            "substance_&_medication": "substance_medication",
        }
        target_domain = domain_aliases.get(topic_clean, topic_clean)

        filtered = []
        for doc in results:
            # Match if domain is covered or any tag matches topic
            if target_domain in doc.domains:
                filtered.append(doc)
            elif any(topic_clean in tag.lower() for tag in doc.evidence_tags):
                filtered.append(doc)
            elif any(target_domain in (get_tag_domain(t) or "") for t in doc.evidence_tags):
                filtered.append(doc)
        results = filtered

    # Filter by document type
    if doc_type and doc_type.strip():
        dt_clean = doc_type.strip().lower()
        results = [d for d in results if d.document_type.lower() == dt_clean or d.evidence_type.lower() == dt_clean]

    # Filter by text search query
    if q and q.strip():
        query_terms = q.strip().lower().split()
        matched = []
        for d in results:
            searchable_text = f"{d.title} {d.organization} {d.source} {d.source_identifier} {d.summary} {' '.join(d.evidence_tags)} {' '.join(c.topic + ' ' + c.text for c in d.chunks)}".lower()
            if all(term in searchable_text for term in query_terms):
                matched.append(d)
        results = matched

    return results


@router.get("/stats", response_model=EvidenceStatsOut)
def get_evidence_stats():
    """Returns dynamic evidence counts per domain and total corpus statistics."""
    total_docs = len(EVIDENCE_CORPUS)
    total_chunks = sum(len(doc.chunks) for doc in EVIDENCE_CORPUS)

    domain_counts: List[DomainCount] = []
    for dom_id, dom_label in DOMAIN_LABELS.items():
        # Count documents that have at least one tag in this domain
        doc_count = sum(
            1 for doc in EVIDENCE_CORPUS
            if any(get_tag_domain(tag) == dom_id for tag in doc.evidence_tags)
        )
        # Count chunks that have at least one tag in this domain
        chunk_count = sum(
            1 for doc in EVIDENCE_CORPUS
            for chunk in doc.chunks
            if any(get_tag_domain(tag) == dom_id for tag in chunk.evidence_tags)
        )
        domain_counts.append(
            DomainCount(
                domain_id=dom_id,
                domain_label=dom_label,
                document_count=doc_count,
                chunk_count=chunk_count,
            )
        )

    return EvidenceStatsOut(
        total_documents=total_docs,
        total_chunks=total_chunks,
        domain_counts=domain_counts,
    )


@router.get("/{evidence_id}", response_model=EvidenceDocumentOut)
def get_evidence_document(evidence_id: str):
    """Retrieve a single authoritative evidence document and all its chunks by ID."""
    doc = DOCUMENT_MAP.get(evidence_id.strip())
    if not doc:
        # Check case-insensitive
        for d in EVIDENCE_CORPUS:
            if d.id.lower() == evidence_id.strip().lower():
                doc = d
                break

    if not doc:
        raise HTTPException(status_code=404, detail="Resource not found in evidence library.")

    return _map_doc_to_out(doc)
