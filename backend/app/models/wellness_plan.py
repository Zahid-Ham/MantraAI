import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, Float, Date, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class WellnessPlan(Base):
    """
    User's active or archived personalized wellness plan.
    Links to the source AssessmentSession when available.
    Strictly non-diagnostic and non-prescriptive.
    """
    __tablename__ = "wellness_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assessment_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title = Column(String(255), nullable=False, default="Personalized Wellness Plan")
    status = Column(String(50), nullable=False, default="active")  # "active", "completed", "archived"
    focus_areas = Column(JSONB, nullable=False, default=list)  # list of strings
    clinical_disclaimer = Column(
        Text,
        nullable=False,
        default=(
            "MantraAI wellness plans provide evidence-informed lifestyle and routine suggestions. "
            "They are strictly non-diagnostic and do not replace professional medical advice, clinical diagnosis, "
            "or medical treatment. For severe or concerning symptoms, consult a qualified healthcare professional."
        ),
    )
    is_baseline_educational = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", backref="wellness_plans")
    assessment_session = relationship("AssessmentSession", backref="wellness_plans")
    action_items = relationship(
        "WellnessActionItem",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="WellnessActionItem.priority.asc(), WellnessActionItem.created_at.asc()",
    )


class WellnessActionItem(Base):
    """
    Individual evidence-informed wellness action item in a user's plan.
    Maintains provenance to clinical guidelines and user-reported context.
    """
    __tablename__ = "wellness_action_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(
        UUID(as_uuid=True),
        ForeignKey("wellness_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action_key = Column(String(120), nullable=False, index=True)  # unique hash/slug to prevent duplicate additions
    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    domain = Column(String(100), nullable=False)  # "sleep_routine", "physical_activity", "stress_management", etc.
    frequency = Column(String(50), nullable=False, default="daily")  # "daily", "3x_weekly", "weekly", "ongoing"
    target_value = Column(Float, nullable=True)
    target_unit = Column(String(50), nullable=True)  # "minutes", "hours", "steps", "times"
    start_date = Column(Date, nullable=False, default=func.current_date())
    status = Column(String(50), nullable=False, default="active")  # "active", "paused", "dismissed", "completed"
    
    # Evidence provenance & clinical transparency
    evidence_sources = Column(JSONB, nullable=False, default=list)  # list of source objects with provenance
    evidence_sufficiency = Column(String(50), nullable=False, default="sufficient")  # "sufficient", "educational"
    is_from_assessment = Column(Boolean, nullable=False, default=False)
    priority = Column(Integer, nullable=False, default=1)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("plan_id", "action_key", name="uq_plan_action_key"),
    )

    plan = relationship("WellnessPlan", back_populates="action_items")
    user = relationship("User", backref="wellness_action_items")
    logs = relationship(
        "WellnessActionLog",
        back_populates="action_item",
        cascade="all, delete-orphan",
        order_by="WellnessActionLog.date.desc()",
    )


class WellnessActionLog(Base):
    """
    Daily completion tracking log for an action item.
    Enables tracking of completion history, skips, postponement, and weekly adherence.
    """
    __tablename__ = "wellness_action_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("wellness_action_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(String(50), nullable=False)  # "completed", "skipped", "postponed"
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("action_item_id", "date", name="uq_action_date_log"),
    )

    action_item = relationship("WellnessActionItem", back_populates="logs")
    user = relationship("User", backref="wellness_action_logs")
