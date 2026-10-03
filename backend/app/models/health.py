import uuid
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, func, UniqueConstraint, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class HealthConnection(Base):
    """
    Represents a user's connection to a health-data provider.
    Enables future Android Health Connect or mobile provider connections
    without altering the underlying daily metrics schema.
    """
    __tablename__ = "health_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String, nullable=False, index=True)  # e.g., "mock", "health_connect", "mobile"
    status = Column(String, nullable=False, default="connected")  # "connected", "disconnected", "error"
    display_name = Column(String, nullable=True)  # e.g., "Mock Health Provider", "Android Health Connect"
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", backref="health_connections")


class HealthDailyMetrics(Base):
    """
    Main normalized daily health record.
    One record per user per calendar date per data source.
    Observational passive wellness data only — strictly non-diagnostic.
    """
    __tablename__ = "health_daily_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id = Column(UUID(as_uuid=True), ForeignKey("health_connections.id", ondelete="SET NULL"), nullable=True)
    date = Column(Date, nullable=False, index=True)
    source = Column(String, nullable=False, index=True)  # e.g., "mock", "health_connect", "manual"
    source_device = Column(String, nullable=True)  # e.g., "Mock Health Device", "Pixel 8"
    
    # Primary health metrics (all nullable to reflect real-world capture availability)
    steps = Column(Integer, nullable=True)
    active_minutes = Column(Integer, nullable=True)
    workout_minutes = Column(Integer, nullable=True)
    sleep_duration_minutes = Column(Integer, nullable=True)
    sleep_start = Column(DateTime(timezone=True), nullable=True)
    sleep_end = Column(DateTime(timezone=True), nullable=True)
    resting_heart_rate = Column(Integer, nullable=True)
    active_calories = Column(Float, nullable=True)
    distance = Column(Float, nullable=True)
    water_intake = Column(Float, nullable=True)

    sync_status = Column(String, nullable=False, default="synced")
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Unique constraint ensuring idempotency on (user_id, date, source)
    __table_args__ = (
        UniqueConstraint("user_id", "date", "source", name="uq_user_date_source_health_metrics"),
    )

    user = relationship("User", backref="health_daily_metrics")
    connection = relationship("HealthConnection", backref="daily_metrics")


class AdaptiveGoal(Base):
    """
    Personalized daily health goals calculated deterministically from recent activity trends.
    Non-clinical, rule-based, and shared across web, mobile, and future smartwatch platforms.
    """
    __tablename__ = "adaptive_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    goal_type = Column(String, nullable=False)  # "steps", "active_minutes", "workout_minutes", "sleep_consistency", "action_plan"
    title = Column(String, nullable=False)
    target_value = Column(Float, nullable=True)
    unit = Column(String, nullable=True)  # e.g., "steps", "minutes", "task"
    rationale = Column(Text, nullable=True)
    source = Column(String, nullable=False, default="adaptive_goal_engine")
    status = Column(String, nullable=False, default="pending")  # "pending", "in_progress", "completed", "skipped"
    progress_value = Column(Float, nullable=True, default=0.0)
    metadata_payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "date", "goal_type", name="uq_user_date_goal_type"),
    )

    user = relationship("User", backref="adaptive_goals")
