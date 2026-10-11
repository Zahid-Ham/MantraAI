import uuid
from sqlalchemy import Column, String, DateTime, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class AccountDeletionRecord(Base):
    """
    Durable tracking of account deletion requests across two-phase distributed deletion.
    Maintains status, timestamps, and retry counts across PostgreSQL data wiping
    and Firebase identity deletion.
    
    Status states:
    - PENDING: Request initiated, processing
    - DB_DELETED: All personal health records wiped from PostgreSQL
    - PENDING_FIREBASE: Database records wiped, but Firebase deletion encountered an issue and requires retry
    - COMPLETED: Both database data graph and Firebase identity account deleted
    - FAILED: Deletion could not be started or database transaction rolled back
    """
    __tablename__ = "account_deletion_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String(128), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    status = Column(String(50), nullable=False, default="PENDING", index=True)
    records_deleted = Column(Text, nullable=True)  # JSON-encoded summary of counts
    error_message = Column(Text, nullable=True)
    initiated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
