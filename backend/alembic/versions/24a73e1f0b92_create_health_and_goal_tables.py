"""Create health and goal tables

Revision ID: 24a73e1f0b92
Revises: 10b94cfb285b
Create Date: 2026-10-03 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '24a73e1f0b92'
down_revision: Union[str, Sequence[str], None] = '10b94cfb285b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create health_connections table
    op.create_table(
        "health_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_health_connections_user_id"), "health_connections", ["user_id"], unique=False)
    op.create_index(op.f("ix_health_connections_provider"), "health_connections", ["provider"], unique=False)

    # 2. Create health_daily_metrics table
    op.create_table(
        "health_daily_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("source_device", sa.String(), nullable=True),
        sa.Column("steps", sa.Integer(), nullable=True),
        sa.Column("active_minutes", sa.Integer(), nullable=True),
        sa.Column("workout_minutes", sa.Integer(), nullable=True),
        sa.Column("sleep_duration_minutes", sa.Integer(), nullable=True),
        sa.Column("sleep_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sleep_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resting_heart_rate", sa.Integer(), nullable=True),
        sa.Column("active_calories", sa.Float(), nullable=True),
        sa.Column("distance", sa.Float(), nullable=True),
        sa.Column("water_intake", sa.Float(), nullable=True),
        sa.Column("sync_status", sa.String(), nullable=False, server_default="synced"),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["connection_id"], ["health_connections.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "date", "source", name="uq_user_date_source_health_metrics")
    )
    op.create_index(op.f("ix_health_daily_metrics_user_id"), "health_daily_metrics", ["user_id"], unique=False)
    op.create_index(op.f("ix_health_daily_metrics_date"), "health_daily_metrics", ["date"], unique=False)
    op.create_index(op.f("ix_health_daily_metrics_source"), "health_daily_metrics", ["source"], unique=False)

    # 3. Create adaptive_goals table
    op.create_table(
        "adaptive_goals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("goal_type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("target_value", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("source", sa.String(), nullable=False, server_default="adaptive_goal_engine"),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("progress_value", sa.Float(), nullable=True, server_default="0"),
        sa.Column("metadata_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "date", "goal_type", name="uq_user_date_goal_type")
    )
    op.create_index(op.f("ix_adaptive_goals_user_id"), "adaptive_goals", ["user_id"], unique=False)
    op.create_index(op.f("ix_adaptive_goals_date"), "adaptive_goals", ["date"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("adaptive_goals")
    op.drop_table("health_daily_metrics")
    op.drop_table("health_connections")
