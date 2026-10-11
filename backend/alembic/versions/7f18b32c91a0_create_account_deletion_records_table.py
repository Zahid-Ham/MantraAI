"""create account deletion records table

Revision ID: 7f18b32c91a0
Revises: 5a91e84c12d4
Create Date: 2026-10-11 13:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7f18b32c91a0'
down_revision: Union[str, None] = '5a91e84c12d4'
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'account_deletion_records',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('firebase_uid', sa.String(length=128), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('records_deleted', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('initiated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_account_deletion_records_firebase_uid'), 'account_deletion_records', ['firebase_uid'], unique=False)
    op.create_index(op.f('ix_account_deletion_records_user_id'), 'account_deletion_records', ['user_id'], unique=False)
    op.create_index(op.f('ix_account_deletion_records_status'), 'account_deletion_records', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_account_deletion_records_status'), table_name='account_deletion_records')
    op.drop_index(op.f('ix_account_deletion_records_user_id'), table_name='account_deletion_records')
    op.drop_index(op.f('ix_account_deletion_records_firebase_uid'), table_name='account_deletion_records')
    op.drop_table('account_deletion_records')
