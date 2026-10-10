"""SharedReport database model for secure, expiring clinician one-pager links."""

import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, backref
from app.database import Base


class SharedReport(Base):
    __tablename__ = "shared_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assessment_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    # Store only the SHA-256 hash of the 32-byte urlsafe secret token
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    max_views = Column(Integer, nullable=False, default=10)
    view_count = Column(Integer, nullable=False, default=0)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    included_sections = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref=backref("shared_reports", passive_deletes=True))
    assessment_session = relationship("AssessmentSession", backref="shared_reports")
