"""add report status to assessment sessions

Revision ID: f6a829b3c4d5
Revises: e5f718a2b3c4
Create Date: 2026-10-11 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f6a829b3c4d5'
down_revision: Union[str, Sequence[str], None] = 'e5f718a2b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add report_status and report_error_class to assessment_sessions."""
    op.add_column(
        'assessment_sessions',
        sa.Column('report_status', sa.String(), nullable=False, server_default='ready')
    )
    op.add_column(
        'assessment_sessions',
        sa.Column('report_error_class', sa.String(), nullable=True)
    )
    op.create_index(
        op.f('ix_assessment_sessions_report_status'),
        'assessment_sessions',
        ['report_status'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema: drop report_status and report_error_class from assessment_sessions."""
    op.drop_index(op.f('ix_assessment_sessions_report_status'), table_name='assessment_sessions')
    op.drop_column('assessment_sessions', 'report_error_class')
    op.drop_column('assessment_sessions', 'report_status')
