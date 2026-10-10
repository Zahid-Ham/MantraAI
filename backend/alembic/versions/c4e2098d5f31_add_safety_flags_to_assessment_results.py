"""add safety_flags to assessment_results

Revision ID: c4e2098d5f31
Revises: 24a73e1f0b92
Create Date: 2026-10-11 04:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c4e2098d5f31'
down_revision: Union[str, Sequence[str], None] = '24a73e1f0b92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add nullable safety_flags JSONB column to assessment_results."""
    op.add_column(
        'assessment_results',
        sa.Column(
            'safety_flags',
            postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), 'sqlite'),
            nullable=True,
        )
    )


def downgrade() -> None:
    """Downgrade schema: remove safety_flags column."""
    op.drop_column('assessment_results', 'safety_flags')
