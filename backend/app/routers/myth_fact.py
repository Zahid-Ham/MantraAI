"""
MantraAI — Myth vs Fact API Router
==================================

PURPOSE
-------
Provides high-performance, clinically safe REST endpoints for:
1. Submitting claims/questions to the Myth vs Fact classification engine.
2. Searching, filtering, and retrieving reviewed/draft canonical claims and sources.
3. Accessing authenticated user-specific query history with strict tenant isolation.
4. Programmatically triggering or verifying idempotent corpus imports.

SECURITY & SAFETY RULES:
-------------------------
- All draft and synthesized responses are explicitly flagged with `is_verified=False`.
- User history endpoints require verified Firebase Auth tokens.
- Never logs sensitive raw answers or exposes private user information.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth.firebase_auth import get_current_user, get_optional_current_user, require_admin_user
from app.models.user import User
from app.models.myth_fact import (
    MythFactSource,
    MythFactClaim,
    MythFactQueryHistory,
)
from app.schemas.myth_fact import (
    MythFactQueryRequest,
    MythFactQueryResponse,
    MythFactClaimSummary,
    MythFactClaimOut,
    MythFactSourceOut,
    MythFactQueryHistoryOut,
    MythFactStatsOut,
    MythFactDomainCount,
    MythFactClassificationCount,
    MythFactClassification,
)
from app.services.myth_fact_service import (
    process_myth_fact_query,
    resolve_sources_for_claim,
)
from app.services.myth_fact_importer import (
    import_myth_fact_corpus,
    normalize_text_for_matching,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/myth-fact", tags=["myth-fact"])


# ---------------------------------------------------------------------------
# 1. Primary Query / Verification Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/query",
    response_model=MythFactQueryResponse,
    summary="Query Myth vs Fact Engine",
    description="Classifies a health claim, misconception, or question against canonical corpus or synthesizes an evidence-grounded answer."
)
def query_myth_vs_fact(
    request: MythFactQueryRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    try:
        response = process_myth_fact_query(
            request=request,
            db=db,
            user=current_user,
        )
        return response
    except Exception as e:
        logger.error("Myth vs Fact query processing failure: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while evaluating this claim. Please try again."
        )


# ---------------------------------------------------------------------------
# 2. Canonical Claims Search & Retrieval
# ---------------------------------------------------------------------------

@router.get(
    "/claims",
    response_model=List[MythFactClaimSummary],
    summary="Search & List Canonical Claims",
    description="Retrieves canonical claims with optional keyword search, domain filtering, and classification filtering."
)
def list_canonical_claims(
    q: Optional[str] = Query(None, description="Keyword search query"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    classification: Optional[MythFactClassification] = Query(None, description="Filter by classification"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=200, description="Pagination limit"),
    db: Session = Depends(get_db),
):
    query = db.query(MythFactClaim)

    if domain:
        query = query.filter(MythFactClaim.domain == domain.strip().lower())
    if classification:
        query = query.filter(MythFactClaim.classification == classification.value)
    if q and q.strip():
        norm_q = normalize_text_for_matching(q)
        query = query.filter(
            (MythFactClaim.normalized_claim.like(f"%{norm_q}%")) |
            (MythFactClaim.claim_id.ilike(f"%{q.strip()}%")) |
            (MythFactClaim.explanation.ilike(f"%{q.strip()}%"))
        )

    claims = query.order_by(MythFactClaim.claim_id.asc()).offset(skip).limit(limit).all()

    summaries = []
    for c in claims:
        summaries.append(
            MythFactClaimSummary(
                claim_id=c.claim_id,
                canonical_claim=c.canonical_claim,
                classification=MythFactClassification(c.classification),
                domain=c.domain,
                explanation=c.explanation,
                evidence_source_ids=c.evidence_source_ids or [],
                review_status=c.review_status,
                is_verified=(c.review_status == "CLINICIAN_VERIFIED"),
                version=c.version,
            )
        )
    return summaries


@router.get(
    "/claims/{claim_id}",
    response_model=MythFactClaimOut,
    summary="Get Canonical Claim by ID",
    description="Retrieves a single canonical claim with its aliases, full explanation, and resolved source references."
)
def get_canonical_claim_by_id(
    claim_id: str,
    db: Session = Depends(get_db),
):
    clean_id = claim_id.strip().upper()
    claim = db.query(MythFactClaim).filter(MythFactClaim.claim_id == clean_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Myth vs Fact claim '{clean_id}' not found in canonical corpus."
        )

    sources = resolve_sources_for_claim(claim.evidence_source_ids or [], db)
    alias_texts = [a.alias for a in claim.aliases]

    return MythFactClaimOut(
        claim_id=claim.claim_id,
        canonical_claim=claim.canonical_claim,
        classification=MythFactClassification(claim.classification),
        domain=claim.domain,
        explanation=claim.explanation,
        evidence_source_ids=claim.evidence_source_ids or [],
        sources=sources,
        aliases=alias_texts,
        review_status=claim.review_status,
        is_verified=(claim.review_status == "CLINICIAN_VERIFIED"),
        version=claim.version,
        notes=claim.notes,
        created_at=claim.created_at,
        updated_at=claim.updated_at,
    )


# ---------------------------------------------------------------------------
# 3. Sources Registry
# ---------------------------------------------------------------------------

@router.get(
    "/sources",
    response_model=List[MythFactSourceOut],
    summary="List Evidence Sources",
    description="Retrieves all registered authoritative guideline sources referenced by Myth vs Fact claims."
)
def list_evidence_sources(db: Session = Depends(get_db)):
    sources = db.query(MythFactSource).order_by(MythFactSource.source_id.asc()).all()
    return [MythFactSourceOut.model_validate(s) for s in sources]


# ---------------------------------------------------------------------------
# 4. Corpus Statistics
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=MythFactStatsOut,
    summary="Get Myth vs Fact Corpus Statistics",
    description="Returns aggregate statistics across canonical claims, classifications, and domains."
)
def get_corpus_stats(db: Session = Depends(get_db)):
    total_claims = db.query(func.count(MythFactClaim.claim_id)).scalar() or 0
    total_sources = db.query(func.count(MythFactSource.source_id)).scalar() or 0
    total_aliases = db.query(func.count()).select_from(MythFactClaim).join(MythFactClaim.aliases).scalar() or 0

    class_counts_raw = (
        db.query(MythFactClaim.classification, func.count(MythFactClaim.claim_id))
        .group_by(MythFactClaim.classification)
        .all()
    )
    by_classification = [
        MythFactClassificationCount(classification=MythFactClassification(k), count=cnt)
        for k, cnt in class_counts_raw
        if k in MythFactClassification._value2member_map_
    ]

    domain_counts_raw = (
        db.query(MythFactClaim.domain, func.count(MythFactClaim.claim_id))
        .group_by(MythFactClaim.domain)
        .all()
    )
    by_domain = [
        MythFactDomainCount(domain=dom, count=cnt)
        for dom, cnt in domain_counts_raw
    ]

    status_counts_raw = (
        db.query(MythFactClaim.review_status, func.count(MythFactClaim.claim_id))
        .group_by(MythFactClaim.review_status)
        .all()
    )
    review_status_summary = {st: cnt for st, cnt in status_counts_raw}

    return MythFactStatsOut(
        total_canonical_claims=total_claims,
        total_aliases=total_aliases,
        total_sources=total_sources,
        by_classification=by_classification,
        by_domain=by_domain,
        review_status_summary=review_status_summary,
    )


# ---------------------------------------------------------------------------
# 5. Authenticated User Query History (Strict Tenant Isolation)
# ---------------------------------------------------------------------------

@router.get(
    "/history",
    response_model=List[MythFactQueryHistoryOut],
    summary="Get User Query History",
    description="Retrieves recent myth vs fact queries submitted by the authenticated user."
)
def get_user_query_history(
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    history_records = (
        db.query(MythFactQueryHistory)
        .filter(MythFactQueryHistory.user_id == current_user.id)
        .order_by(MythFactQueryHistory.created_at.desc())
        .limit(limit)
        .all()
    )

    out = []
    for r in history_records:
        out.append(
            MythFactQueryHistoryOut(
                id=str(r.id),
                query_text=r.query_text,
                match_type=r.match_type,
                matched_claim_id=r.matched_claim_id,
                classification=MythFactClassification(r.classification),
                domain=r.domain,
                explanation=r.explanation,
                evidence_source_ids=r.evidence_source_ids or [],
                review_status=r.review_status,
                confidence_score=r.confidence_score,
                created_at=r.created_at,
            )
        )
    return out


# ---------------------------------------------------------------------------
# 6. Idempotent Corpus Import Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/import",
    summary="Trigger Idempotent Corpus Import (Admin Only)",
    description="Runs the idempotent CSV/JSON validation and import pipeline. Requires administrator authorization (admin role or X-Admin-Key)."
)
def trigger_corpus_import(
    db: Session = Depends(get_db),
    admin_user: Optional[User] = Depends(require_admin_user),
):
    try:
        result = import_myth_fact_corpus(db)
        return {
            "status": "success",
            "message": "Myth vs Fact corpus successfully imported and verified.",
            "details": result,
        }
    except Exception as e:
        logger.error("Corpus import execution failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Corpus import failed: {str(e)}"
        )
