"""crm contacts, interactions and reminders

Adds the full contact profile (phone, company, title, birthday, notes,
keep-in-touch cadence, last_contacted_at, is_sample), drops the free-text
last_interaction, creates the interactions and reminders tables, and marks the
12 rows the old frontend seeder created as samples.

Revision ID: 52362808c598
Revises: 7a491dd8fbb2
Create Date: 2026-10-18 08:59:59.539407

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "52362808c598"
down_revision: str | None = "7a491dd8fbb2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# The 12 emails the old one-click seeder (frontend/src/data/seed.ts) created.
SEED_EMAILS = (
    "sebastian.gray@gmail.com",
    "hunter.brooks@outlook.com",
    "lucas.a@company.io",
    "nathan.phillips@company.io",
    "aaron.butler@gmail.com",
    "ben.scott@work.com",
    "elijah.harris@gmail.com",
    "joshua.murphy@company.io",
    "will.young@work.com",
    "mason.t@gmail.com",
    "aiden.parker@company.io",
    "jackson.brooks@gmail.com",
)


def upgrade() -> None:
    # contacts first: on SQLite batch mode rebuilds the table, so change it
    # before the new tables add foreign keys pointing at it.
    with op.batch_alter_table("contacts") as batch_op:
        batch_op.add_column(sa.Column("phone", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("company", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("title", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("birthday", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("notes", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("stay_in_touch_days", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("last_contacted_at", sa.DateTime(), nullable=True))
        batch_op.add_column(
            sa.Column("is_sample", sa.Boolean(), server_default=sa.false(), nullable=False)
        )
        batch_op.drop_column("last_interaction")

    # Data step: flag the old seeder's rows so DELETE /api/samples can remove them.
    contacts = sa.table(
        "contacts",
        sa.column("email", sa.String()),
        sa.column("is_sample", sa.Boolean()),
    )
    op.execute(contacts.update().where(contacts.c.email.in_(SEED_EMAILS)).values(is_sample=True))

    op.create_table(
        "interactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("contact_id", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["contact_id"], ["contacts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_interactions_contact_id_occurred_at",
        "interactions",
        ["contact_id", "occurred_at"],
        unique=False,
    )
    op.create_index(
        "ix_interactions_user_id_occurred_at",
        "interactions",
        ["user_id", "occurred_at"],
        unique=False,
    )
    op.create_table(
        "reminders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("contact_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("done", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("done_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["contact_id"], ["contacts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_reminders_user_id_done_due_date",
        "reminders",
        ["user_id", "done", "due_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_reminders_user_id_done_due_date", table_name="reminders")
    op.drop_table("reminders")
    op.drop_index("ix_interactions_user_id_occurred_at", table_name="interactions")
    op.drop_index("ix_interactions_contact_id_occurred_at", table_name="interactions")
    op.drop_table("interactions")

    # The free-text last_interaction values are gone; the column comes back empty.
    with op.batch_alter_table("contacts") as batch_op:
        batch_op.add_column(sa.Column("last_interaction", sa.String(length=100), nullable=True))
        batch_op.drop_column("is_sample")
        batch_op.drop_column("last_contacted_at")
        batch_op.drop_column("stay_in_touch_days")
        batch_op.drop_column("notes")
        batch_op.drop_column("birthday")
        batch_op.drop_column("title")
        batch_op.drop_column("company")
        batch_op.drop_column("phone")
