"""Create companion conversation and message tables

Revision ID: 31a8f9c0e21b
Revises: 24a73e1f0b92
Create Date: 2026-10-10 20:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '31a8f9c0e21b'
down_revision: Union[str, Sequence[str], None] = '24a73e1f0b92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "companion_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False, server_default="Health Discussion"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_companion_conversations_user_id", "companion_conversations", ["user_id"])

    op.create_table(
        "companion_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companion_conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sources", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("evidence_sufficiency", sa.String(30), nullable=False, server_default="sufficient"),
        sa.Column("review_status", sa.String(100), nullable=False, server_default="AI_SYNTHESIZED_UNREVIEWED"),
        sa.Column("domain", sa.String(100), nullable=False, server_default="general_health"),
        sa.Column("is_escalation", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("escalation_reason", sa.String(255), nullable=True),
        sa.Column("disclaimer", sa.Text(), nullable=True),
        sa.Column("suggested_followups", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_companion_messages_conversation_id", "companion_messages", ["conversation_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_companion_messages_conversation_id", table_name="companion_messages")
    op.drop_table("companion_messages")
    op.drop_index("ix_companion_conversations_user_id", table_name="companion_conversations")
    op.drop_table("companion_conversations")
