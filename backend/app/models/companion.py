import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class CompanionConversation(Base):
    """
    User conversation session with the AI Health Companion.
    Enforces strict user ownership via foreign key to User.
    """
    __tablename__ = "companion_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Health Discussion")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", backref="companion_conversations")
    messages = relationship(
        "CompanionMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="CompanionMessage.created_at.asc()",
    )


class CompanionMessage(Base):
    """
    Individual turn in an AI Health Companion conversation.
    Stores user queries and assistant responses with grounded evidence sources and audit metadata.
    """
    __tablename__ = "companion_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companion_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(20), nullable=False)  # "user" | "assistant" | "system"
    content = Column(Text, nullable=False)

    # Assistant grounding & safety metadata
    sources = Column(JSONB, nullable=False, default=list)  # list of source objects
    evidence_sufficiency = Column(String(30), nullable=False, default="sufficient")  # sufficient | partial | insufficient
    review_status = Column(String(100), nullable=False, default="AI_SYNTHESIZED_UNREVIEWED")
    domain = Column(String(100), nullable=False, default="general_health")
    is_escalation = Column(Boolean, nullable=False, default=False)
    escalation_reason = Column(String(255), nullable=True)
    disclaimer = Column(Text, nullable=True)
    suggested_followups = Column(JSONB, nullable=False, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    conversation = relationship("CompanionConversation", back_populates="messages")
