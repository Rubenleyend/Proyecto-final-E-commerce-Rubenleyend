"""Add user profile fields

Revision ID: 64fea2d1c811
Revises: 0078a2e22c5e
Create Date: 2025-12-27 22:39:05.318229
"""

from alembic import op
import sqlalchemy as sa

revision = '64fea2d1c811'
down_revision = '0078a2e22c5e'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('name', sa.String(length=80), nullable=True))
        batch_op.add_column(sa.Column('lastname', sa.String(length=80), nullable=True))
        batch_op.add_column(sa.Column('address', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")))

    # Quitamos el default para created_at (queda como en el modelo: lo rellena SQLAlchemy al crear nuevos)
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('created_at', server_default=None)


def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('created_at')
        batch_op.drop_column('address')
        batch_op.drop_column('lastname')
        batch_op.drop_column('name')
