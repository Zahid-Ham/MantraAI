"""SemenReport database model for manual entry and WHO 6th edition interpretation."""

import uuid
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref
from app.database import Base


class SemenReport(Base):
    __tablename__ = "semen_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    collection_date = Column(Date, nullable=False)
    abstinence_days = Column(Integer, nullable=True)
    volume_ml = Column(Float, nullable=True)
    concentration_m_per_ml = Column(Float, nullable=True)
    total_count_m = Column(Float, nullable=True)
    total_motility_pct = Column(Float, nullable=True)
    progressive_motility_pct = Column(Float, nullable=True)
    vitality_pct = Column(Float, nullable=True)
    normal_morphology_pct = Column(Float, nullable=True)
    ph = Column(Float, nullable=True)
    lab_name = Column(String(255), nullable=True)
    retest_due_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref=backref("semen_reports", passive_deletes=True))
