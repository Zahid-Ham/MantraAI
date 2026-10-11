"""create phase3 care connected tables

Revision ID: e5f718a2b3c4
Revises: c4e2098d5f31
Create Date: 2026-10-11 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e5f718a2b3c4'
down_revision: Union[str, Sequence[str], None] = 'c4e2098d5f31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: create shared_reports, cycle_plans, cycle_checkins, and semen_reports."""
    uuid_type = postgresql.UUID(as_uuid=True).with_variant(sa.CHAR(36), 'sqlite')
    json_type = postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), 'sqlite')

    # 1. Create shared_reports table
    op.create_table(
        'shared_reports',
        sa.Column('id', uuid_type, primary_key=True),
        sa.Column('user_id', uuid_type, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assessment_session_id', uuid_type, sa.ForeignKey('assessment_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('max_views', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('included_sections', json_type, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f('ix_shared_reports_user_id'), 'shared_reports', ['user_id'], unique=False)
    op.create_index(op.f('ix_shared_reports_assessment_session_id'), 'shared_reports', ['assessment_session_id'], unique=False)
    op.create_index(op.f('ix_shared_reports_token_hash'), 'shared_reports', ['token_hash'], unique=True)

    # 2. Create cycle_plans table
    op.create_table(
        'cycle_plans',
        sa.Column('id', uuid_type, primary_key=True),
        sa.Column('user_id', uuid_type, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assessment_session_id', uuid_type, sa.ForeignKey('assessment_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='active'),
        sa.Column('focus_factors', json_type, nullable=False),
        sa.Column('retest_prompted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f('ix_cycle_plans_user_id'), 'cycle_plans', ['user_id'], unique=False)
    op.create_index(op.f('ix_cycle_plans_assessment_session_id'), 'cycle_plans', ['assessment_session_id'], unique=False)

    # 3. Create cycle_checkins table
    op.create_table(
        'cycle_checkins',
        sa.Column('id', uuid_type, primary_key=True),
        sa.Column('plan_id', uuid_type, sa.ForeignKey('cycle_plans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('week_index', sa.Integer(), nullable=False),
        sa.Column('factor_id', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f('ix_cycle_checkins_plan_id'), 'cycle_checkins', ['plan_id'], unique=False)

    # 4. Create semen_reports table
    op.create_table(
        'semen_reports',
        sa.Column('id', uuid_type, primary_key=True),
        sa.Column('user_id', uuid_type, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('collection_date', sa.Date(), nullable=False),
        sa.Column('abstinence_days', sa.Integer(), nullable=True),
        sa.Column('volume_ml', sa.Float(), nullable=True),
        sa.Column('concentration_m_per_ml', sa.Float(), nullable=True),
        sa.Column('total_count_m', sa.Float(), nullable=True),
        sa.Column('total_motility_pct', sa.Float(), nullable=True),
        sa.Column('progressive_motility_pct', sa.Float(), nullable=True),
        sa.Column('vitality_pct', sa.Float(), nullable=True),
        sa.Column('normal_morphology_pct', sa.Float(), nullable=True),
        sa.Column('ph', sa.Float(), nullable=True),
        sa.Column('lab_name', sa.String(length=255), nullable=True),
        sa.Column('retest_due_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f('ix_semen_reports_user_id'), 'semen_reports', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema: drop Phase 3 tables."""
    op.drop_table('semen_reports')
    op.drop_table('cycle_checkins')
    op.drop_table('cycle_plans')
    op.drop_table('shared_reports')
