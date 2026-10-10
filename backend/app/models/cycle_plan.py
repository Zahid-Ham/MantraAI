"""CyclePlan and CycleCheckin database models for the 90-day cycle plan."""

import uuid
from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, backref
from app.database import Base


class CyclePlan(Base):
    __tablename__ = "cycle_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assessment_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(32), nullable=False, default="active")  # active, completed, abandoned, paused
    focus_factors = Column(JSONB, nullable=False)  # Array of 3 factor IDs selected deterministically
    retest_prompted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref=backref("cycle_plans", passive_deletes=True))
    assessment_session = relationship("AssessmentSession", backref="cycle_plans")
    checkins = relationship("CycleCheckin", backref="plan", cascade="all, delete-orphan")


class CycleCheckin(Base):
    __tablename__ = "cycle_checkins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("cycle_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    week_index = Column(Integer, nullable=False)  # 1 to 12
    factor_id = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False)  # done, partial, skipped
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
