from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


# Forbidden medical fields that must never appear in LLM responses
FORBIDDEN_COMPANION_FIELDS = {
    "diagnosis",
    "clinical_diagnosis",
    "fertility_probability",
    "fertility_percentage",
    "infertility_score",
    "prescription",
    "drug_dosage",
    "prescribed_medication",
    "semen_analysis_prediction",
}


class CompanionSourceReference(BaseModel):
    """Provenance-backed clinical evidence source referenced in an assistant response."""
    model_config = ConfigDict(from_attributes=True)

    source_id: str = Field(..., description="Unique identifier of guideline, study, or claim.")
    title: str = Field(..., description="Guideline or source publication title.")
    organization: Optional[str] = Field(None, description="Publishing clinical body (e.g. WHO, AUA, EAU).")
    publication_year: Optional[int] = Field(None, description="Year of publication.")
    url: Optional[str] = Field(None, description="Official publication URL.")
    relevance_excerpt: Optional[str] = Field(None, description="Short factual excerpt relevant to the user's query.")


class ChatRequest(BaseModel):
    """User incoming message to the AI Health Companion."""
    message: str = Field(..., min_length=1, max_length=2500, description="User's query or health question.")
    conversation_id: Optional[UUID] = Field(None, description="Existing conversation UUID, or None to create new.")
    include_health_context: bool = Field(
        False,
        description="Whether to include generalized, non-PII health context from the user's latest assessment.",
    )

    @field_validator("message")
    @classmethod
    def clean_message(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Message cannot be empty or only whitespace.")
        return s


class ChatResponse(BaseModel):
    """Assistant grounded response payload with evidence sources and medical safety disclosures."""
    model_config = ConfigDict(from_attributes=True)

    conversation_id: UUID
    message_id: UUID
    answer: str
    sources: List[CompanionSourceReference] = Field(default_factory=list)
    evidence_sufficiency: str = Field(
        default="sufficient",
        description="'sufficient', 'partial', or 'insufficient' evidence availability.",
    )
    review_status: str = Field(default="AI_SYNTHESIZED_UNREVIEWED")
    domain: str = Field(default="general_health")
    is_escalation: bool = Field(default=False, description="True if urgent clinical consultation was flagged.")
    escalation_reason: Optional[str] = None
    disclaimer: str
    suggested_followups: List[str] = Field(default_factory=list)
    created_at: datetime


class CompanionMessageOut(BaseModel):
    """Individual message item within conversation history."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str  # "user" | "assistant" | "system"
    content: str
    sources: List[CompanionSourceReference] = Field(default_factory=list)
    evidence_sufficiency: str = "sufficient"
    review_status: str = "AI_SYNTHESIZED_UNREVIEWED"
    domain: str = "general_health"
    is_escalation: bool = False
    escalation_reason: Optional[str] = None
    disclaimer: Optional[str] = None
    suggested_followups: List[str] = Field(default_factory=list)
    created_at: datetime


class ConversationSummary(BaseModel):
    """Lightweight conversation listing item for conversation history sidebar."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message_preview: Optional[str] = None


class ConversationDetail(BaseModel):
    """Full conversation detail with chronological message history."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[CompanionMessageOut] = Field(default_factory=list)


class CompanionLLMOutput(BaseModel):
    """Internal strict schema for parsing raw Groq JSON completions."""
    model_config = ConfigDict(extra="forbid")

    answer: str
    cited_evidence_ids: List[str] = Field(default_factory=list)
    evidence_sufficiency: str = "sufficient"  # "sufficient" | "partial" | "insufficient"
    domain: str = "general_health"
    suggested_followups: List[str] = Field(default_factory=list)

    @field_validator("evidence_sufficiency")
    @classmethod
    def validate_sufficiency(cls, v: str) -> str:
        allowed = {"sufficient", "partial", "insufficient"}
        cleaned = v.strip().lower()
        if cleaned not in allowed:
            return "partial"
        return cleaned
