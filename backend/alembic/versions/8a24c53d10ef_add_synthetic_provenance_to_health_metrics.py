"""add synthetic provenance to health metrics

Revision ID: 8a24c53d10ef
Revises: 7f18b32c91a0
Create Date: 2026-10-11 16:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '8a24c53d10ef'
down_revision: Union[str, None] = '7f18b32c91a0'
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None

def upgrade() -> None:
    op.add_column(
        'health_daily_metrics',
        sa.Column('is_synthetic', sa.Boolean(), nullable=False, server_default='false')
    )
    op.create_index(
        op.f('ix_health_daily_metrics_is_synthetic'),
        'health_daily_metrics',
        ['is_synthetic'],
        unique=False
    )
    op.add_column(
        'health_daily_metrics',
        sa.Column('provenance', sa.String(), nullable=True, server_default='device_sensor')
    )

def downgrade() -> None:
    op.drop_column('health_daily_metrics', 'provenance')
    op.drop_index(op.f('ix_health_daily_metrics_is_synthetic'), table_name='health_daily_metrics')
    op.drop_column('health_daily_metrics', 'is_synthetic')
