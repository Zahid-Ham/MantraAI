import uuid
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class MythFactSource(Base):
    """
    Authoritative reference registry for clinical guidelines, studies, and reviews
    supporting the Myth vs Fact corpus.
    """
    __tablename__ = "myth_fact_sources"

    source_id = Column(String(100), primary_key=True)  # e.g., "WHO_INFERTILITY_2025"
    source_title = Column(Text, nullable=False)
    source_url = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class MythFactClaim(Base):
    """
    Canonical reviewed/draft myth vs fact knowledge unit.
    """
    __tablename__ = "myth_fact_claims"

    claim_id = Column(String(50), primary_key=True)  # e.g., "MF-001"
    canonical_claim = Column(Text, nullable=False, index=True)
    normalized_claim = Column(Text, nullable=False, index=True)
    classification = Column(String(50), nullable=False, index=True)  # FACT, MYTH, MISLEADING, CONTEXT_DEPENDENT, INSUFFICIENT_EVIDENCE
    domain = Column(String(100), nullable=False, index=True)  # reproductive_health, sexual_health, hormones, etc.
    explanation = Column(Text, nullable=False)
    evidence_source_ids = Column(JSONB, nullable=False, default=list)  # list of source_ids: ["WHO_INFERTILITY_2025"]
    review_status = Column(String(100), nullable=False, default="CURATED_DRAFT_REQUIRES_CLINICIAN_REVIEW", index=True)
    version = Column(String(20), nullable=False, default="1.0")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    aliases = relationship("MythFactAlias", back_populates="claim", cascade="all, delete-orphan")


class MythFactAlias(Base):
    """
    Alternate phrasing, user search query variants, or colloquial synonyms for canonical claims.
    """
    __tablename__ = "myth_fact_aliases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(String(50), ForeignKey("myth_fact_claims.claim_id", ondelete="CASCADE"), nullable=False, index=True)
    alias = Column(Text, nullable=False)
    normalized_alias = Column(Text, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    claim = relationship("MythFactClaim", back_populates="aliases")


class MythFactGeneratedCache(Base):
    """
    Separate storage/cache for dynamically synthesized Groq answers on non-canonical queries.
    Strictly isolated from reviewed canonical knowledge base units.
    """
    __tablename__ = "myth_fact_generated_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query_hash = Column(String(64), unique=True, nullable=False, index=True)  # SHA256 of normalized query
    query_text = Column(Text, nullable=False)
    classification = Column(String(50), nullable=False)  # FACT, MYTH, MISLEADING, CONTEXT_DEPENDENT, INSUFFICIENT_EVIDENCE
    domain = Column(String(100), nullable=False, default="general_health")
    explanation = Column(Text, nullable=False)
    evidence_ids = Column(JSONB, nullable=False, default=list)  # Cautious guideline chunk IDs cited
    model_provider = Column(String(50), nullable=False, default="groq")
    model_name = Column(String(100), nullable=False)
    review_status = Column(String(100), nullable=False, default="AI_SYNTHESIZED_UNREVIEWED")
    limitations = Column(JSONB, nullable=False, default=list)
    disclaimer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MythFactQueryHistory(Base):
    """
    User query log for authenticated history tracking and auditability.
    Maintains strict user isolation.
    """
    __tablename__ = "myth_fact_query_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    query_text = Column(Text, nullable=False)
    match_type = Column(String(50), nullable=False)  # CANONICAL_EXACT, CANONICAL_ALIAS, CANONICAL_SIMILARITY, SYNTHESIZED_EVIDENCE, INSUFFICIENT_EVIDENCE
    matched_claim_id = Column(String(50), ForeignKey("myth_fact_claims.claim_id", ondelete="SET NULL"), nullable=True)
    classification = Column(String(50), nullable=False)
    domain = Column(String(100), nullable=False)
    explanation = Column(Text, nullable=False)
    evidence_source_ids = Column(JSONB, nullable=False, default=list)
    review_status = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=True)
    model_metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref="myth_fact_queries")
    claim = relationship("MythFactClaim")
