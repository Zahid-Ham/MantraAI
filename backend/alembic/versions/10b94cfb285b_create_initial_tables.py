"""Create initial tables

Revision ID: 10b94cfb285b
Revises: 
Create Date: 2026-08-14 20:05:05.796183

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '10b94cfb285b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    from sqlalchemy.dialects import postgresql

    # 1. Create users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("firebase_uid", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_users_firebase_uid"), "users", ["firebase_uid"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    # 2. Create assessment_sessions table
    op.create_table(
        "assessment_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_version", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_assessment_sessions_user_id"), "assessment_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_assessment_sessions_status"), "assessment_sessions", ["status"], unique=False)

    # 3. Create assessment_responses table
    op.create_table(
        "assessment_responses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", sa.String(), nullable=False),
        sa.Column("response_value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("response_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["assessment_session_id"], ["assessment_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_assessment_responses_assessment_session_id"), "assessment_responses", ["assessment_session_id"], unique=False)
    op.create_index(op.f("ix_assessment_responses_question_id"), "assessment_responses", ["question_id"], unique=False)

    # 4. Create assessment_results table
    op.create_table(
        "assessment_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("overall_category", sa.String(), nullable=False),
        sa.Column("risk_scores", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("interpretation", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["assessment_session_id"], ["assessment_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_assessment_results_assessment_session_id"), "assessment_results", ["assessment_session_id"], unique=False)

    # 5. Create reports table
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_version", sa.String(), nullable=False),
        sa.Column("model_provider", sa.String(), nullable=False),
        sa.Column("model_name", sa.String(), nullable=False),
        sa.Column("report_content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("structured_findings", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["assessment_session_id"], ["assessment_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_reports_assessment_session_id"), "reports", ["assessment_session_id"], unique=False)

    # 6. Create audit_events table
    op.create_table(
        "audit_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("event_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_audit_events_user_id"), "audit_events", ["user_id"], unique=False)
    op.create_index(op.f("ix_audit_events_event_type"), "audit_events", ["event_type"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("audit_events")
    op.drop_table("reports")
    op.drop_table("assessment_results")
    op.drop_table("assessment_responses")
    op.drop_table("assessment_sessions")
    op.drop_table("users")
