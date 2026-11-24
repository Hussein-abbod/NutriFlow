"""Add users.token_version (ends other sessions after a password change)

Revision ID: a4c1d9e2f7b3
Revises: 79ed88a76e66
Create Date: 2026-11-24 13:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4c1d9e2f7b3'
down_revision: Union[str, None] = '79ed88a76e66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('token_version', sa.Integer(), server_default='0', nullable=False),
    )


def downgrade() -> None:
    op.drop_column('users', 'token_version')
