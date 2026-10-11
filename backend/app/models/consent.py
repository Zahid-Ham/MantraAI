import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


from datetime import datetime, timezone

class UserConsent(Base):
    """
    Versioned record of user consent actions for privacy notices and processing scopes.
    Maintains explicit audit trail of consent timestamps, policy versions, and scope types.
    """
    __tablename__ = "user_consents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    consent_type = Column(String(100), nullable=False, index=True)  # e.g., "PRIVACY_POLICY", "HEALTH_DATA_PROCESSING", "THIRD_PARTY_AI_ANALYSIS"
    policy_version = Column(String(50), nullable=False, default="1.0")
    action = Column(String(50), nullable=False, default="ACCEPTED")  # "ACCEPTED", "REVOKED"
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="consents")
