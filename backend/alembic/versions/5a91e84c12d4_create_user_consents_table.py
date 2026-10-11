"""Create user consents table

Revision ID: 5a91e84c12d4
Revises: 48c2b7d91e0a
Create Date: 2026-10-11 12:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5a91e84c12d4'
down_revision: Union[str, Sequence[str], None] = '48c2b7d91e0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to add user_consents table."""
    op.create_table(
        "user_consents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("consent_type", sa.String(length=100), nullable=False, index=True),
        sa.Column("policy_version", sa.String(length=50), nullable=False, server_default="1.0"),
        sa.Column("action", sa.String(length=50), nullable=False, server_default="ACCEPTED"),
        sa.Column("ip_address", sa.String(length=100), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema to drop user_consents table."""
    op.drop_table("user_consents")
