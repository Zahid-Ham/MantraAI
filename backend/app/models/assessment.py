import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, Integer, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_version = Column(String, nullable=False, default="1.0")
    status = Column(String, nullable=False, index=True)  # IN_PROGRESS, COMPLETED, ABANDONED
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", backref="assessment_sessions")

class AssessmentResponse(Base):
    __tablename__ = "assessment_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String, nullable=False, index=True)
    response_value = Column(JSONB, nullable=False)
    response_metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    session = relationship("AssessmentSession", backref="responses")

class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_category = Column(String, nullable=False)
    risk_scores = Column(JSONB, nullable=False)  # Map of category: score
    interpretation = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    session = relationship("AssessmentSession", backref="results")

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    report_version = Column(String, nullable=False, default="1.0")
    model_provider = Column(String, nullable=False)  # e.g., groq
    model_name = Column(String, nullable=False)      # e.g., llama-3.3-70b-versatile
    report_content = Column(JSONB, nullable=False)  # full JSON report output from Groq
    structured_findings = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("AssessmentSession", backref="reports")
