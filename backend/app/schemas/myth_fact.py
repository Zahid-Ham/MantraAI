from datetime import datetime
from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class MythFactClassification(str, Enum):
    FACT = "FACT"
    MYTH = "MYTH"
    MISLEADING = "MISLEADING"
    CONTEXT_DEPENDENT = "CONTEXT_DEPENDENT"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class ReviewStatusEnum(str, Enum):
    CURATED_DRAFT_REQUIRES_CLINICIAN_REVIEW = "CURATED_DRAFT_REQUIRES_CLINICIAN_REVIEW"
    CLINICIAN_REVIEWED = "CLINICIAN_REVIEWED"
    CLINICIAN_VERIFIED = "CLINICIAN_VERIFIED"
    AI_SYNTHESIZED_UNREVIEWED = "AI_SYNTHESIZED_UNREVIEWED"


class MatchTypeEnum(str, Enum):
    CANONICAL_EXACT = "CANONICAL_EXACT"
    CANONICAL_ALIAS = "CANONICAL_ALIAS"
    CANONICAL_SIMILARITY = "CANONICAL_SIMILARITY"
    SYNTHESIZED_EVIDENCE = "SYNTHESIZED_EVIDENCE"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


# ---------------------------------------------------------------------------
# Source & Alias Schemas
# ---------------------------------------------------------------------------

class MythFactSourceOut(BaseModel):
    source_id: str
    source_title: str
    source_url: str

    class Config:
        from_attributes = True


class MythFactAliasOut(BaseModel):
    id: str
    claim_id: str
    alias: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Canonical Claim Schemas
# ---------------------------------------------------------------------------

class MythFactClaimSummary(BaseModel):
    claim_id: str
    canonical_claim: str
    classification: MythFactClassification
    domain: str
    explanation: str
    evidence_source_ids: List[str] = Field(default_factory=list)
    review_status: str
    is_verified: bool = False
    version: str = "1.0"

    class Config:
        from_attributes = True


class MythFactClaimOut(BaseModel):
    claim_id: str
    canonical_claim: str
    classification: MythFactClassification
    domain: str
    explanation: str
    evidence_source_ids: List[str] = Field(default_factory=list)
    sources: List[MythFactSourceOut] = Field(default_factory=list)
    aliases: List[str] = Field(default_factory=list)
    review_status: str
    is_verified: bool = False
    version: str = "1.0"
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Query & Response Schemas
# ---------------------------------------------------------------------------

class MythFactQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Health claim, misconception, or question to check")
    domain_hint: Optional[str] = Field(None, max_length=100, description="Optional domain hint for focused search")
    save_history: Optional[bool] = Field(True, description="Whether to record query in authenticated user history")

    @field_validator("query")
    def validate_query(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Query string cannot be empty or whitespace only.")
        return clean


class SynthesizedEvidenceItem(BaseModel):
    evidence_id: str
    document_id: str
    title: str
    source: str
    organization: Optional[str] = None
    publication_year: Optional[int] = None
    url: str
    source_identifier: Optional[str] = None
    relevance_reason: str
    excerpt: str


class MythFactQueryResponse(BaseModel):
    query: str
    match_type: MatchTypeEnum
    claim_id: Optional[str] = None
    canonical_claim: Optional[str] = None
    classification: MythFactClassification
    domain: str
    explanation: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    review_status: str
    is_verified: bool = False
    sources: List[MythFactSourceOut] = Field(default_factory=list)
    guideline_evidence: List[SynthesizedEvidenceItem] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    disclaimer: str = (
        "MantraAI Myth vs Fact Engine is an evidence-informed educational tool. "
        "Content is curated for general health awareness and does not provide clinical diagnoses, "
        "fertility predictions, or individualized treatment plans. Always consult a qualified healthcare provider."
    )


# ---------------------------------------------------------------------------
# Strict LLM Synthesis Validation Schema
# ---------------------------------------------------------------------------

FORBIDDEN_MYTH_FACT_KEYS = {
    "diagnosis", "disease_diagnosis", "infertility_diagnosis", "diagnosed_condition",
    "fertility_score", "fertility_probability", "infertility_probability", "pregnancy_probability",
    "semen_analysis_prediction", "sperm_count_prediction",
    "prescription", "medication_dosage", "hormone_therapy_prescription"
}

class SynthesizedMythFactLLMOutput(BaseModel):
    """
    Strict Pydantic contract for validating Groq structured output on non-canonical claims.
    Enforces forbidden key rejection and valid classification.
    """
    classification: MythFactClassification
    domain: str = "general_health"
    explanation: str = Field(..., min_length=15, max_length=1500)
    cited_evidence_ids: List[str] = Field(default_factory=list)
    reasoning: Optional[str] = None
    limitations: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def check_forbidden_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            for k in values.keys():
                if k.lower() in FORBIDDEN_MYTH_FACT_KEYS:
                    raise ValueError(f"Forbidden medical diagnosis/probability key '{k}' detected in LLM output.")
        return values


# ---------------------------------------------------------------------------
# History & Stats Schemas
# ---------------------------------------------------------------------------

class MythFactQueryHistoryOut(BaseModel):
    id: str
    query_text: str
    match_type: str
    matched_claim_id: Optional[str] = None
    classification: MythFactClassification
    domain: str
    explanation: str
    evidence_source_ids: List[str] = Field(default_factory=list)
    review_status: str
    confidence_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MythFactDomainCount(BaseModel):
    domain: str
    count: int


class MythFactClassificationCount(BaseModel):
    classification: MythFactClassification
    count: int


class MythFactStatsOut(BaseModel):
    total_canonical_claims: int
    total_aliases: int
    total_sources: int
    by_classification: List[MythFactClassificationCount]
    by_domain: List[MythFactDomainCount]
    review_status_summary: dict[str, int]
