"""Create wellness plan and action tracking tables

Revision ID: 48c2b7d91e0a
Revises: 31a8f9c0e21b
Create Date: 2026-10-10 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '48c2b7d91e0a'
down_revision: Union[str, Sequence[str], None] = '31a8f9c0e21b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to add wellness planner tables."""
    # 1. wellness_plans table
    op.create_table(
        "wellness_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assessment_session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessment_sessions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False, server_default="Personalized Wellness Plan"),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("focus_areas", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("clinical_disclaimer", sa.Text(), nullable=False),
        sa.Column("is_baseline_educational", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_wellness_plans_user_id", "wellness_plans", ["user_id"])
    op.create_index("ix_wellness_plans_assessment_session_id", "wellness_plans", ["assessment_session_id"])

    # 2. wellness_action_items table
    op.create_table(
        "wellness_action_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("wellness_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action_key", sa.String(120), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("domain", sa.String(100), nullable=False),
        sa.Column("frequency", sa.String(50), nullable=False, server_default="daily"),
        sa.Column("target_value", sa.Float(), nullable=True),
        sa.Column("target_unit", sa.String(50), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("evidence_sources", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("evidence_sufficiency", sa.String(50), nullable=False, server_default="sufficient"),
        sa.Column("is_from_assessment", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("plan_id", "action_key", name="uq_plan_action_key"),
    )
    op.create_index("ix_wellness_action_items_plan_id", "wellness_action_items", ["plan_id"])
    op.create_index("ix_wellness_action_items_user_id", "wellness_action_items", ["user_id"])
    op.create_index("ix_wellness_action_items_action_key", "wellness_action_items", ["action_key"])

    # 3. wellness_action_logs table
    op.create_table(
        "wellness_action_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("action_item_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("wellness_action_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("logged_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("action_item_id", "date", name="uq_action_date_log"),
    )
    op.create_index("ix_wellness_action_logs_action_item_id", "wellness_action_logs", ["action_item_id"])
    op.create_index("ix_wellness_action_logs_user_id", "wellness_action_logs", ["user_id"])
    op.create_index("ix_wellness_action_logs_date", "wellness_action_logs", ["date"])


def downgrade() -> None:
    """Downgrade schema to remove wellness planner tables."""
    op.drop_table("wellness_action_logs")
    op.drop_table("wellness_action_items")
    op.drop_table("wellness_plans")
