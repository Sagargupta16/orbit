"""SQLAlchemy ORM models: User, Contact, Interaction and Reminder.

orbit is a single-user-scoped personal CRM. Every Contact, Interaction and
Reminder belongs to a User; all queries filter on user_id. Auth is OAuth-only
(no passwords). Datetimes are stored naive UTC.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    false,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from orbit.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    """A user, authenticated via an OAuth provider (Google or GitHub)."""

    __tablename__ = "users"

    # A provider identity (provider, provider_id) maps to at most one user.
    __table_args__ = (
        UniqueConstraint(
            "auth_provider", "auth_provider_id", name="uq_users_auth_provider_identity"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # OAuth identity
    auth_provider: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    auth_provider_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Session revocation counter, baked into every JWT as `tv`. Bumped on
    # logout / account delete to invalidate all outstanding tokens in one write.
    token_version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=_utcnow, onupdate=_utcnow
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    contacts: Mapped[list[Contact]] = relationship(
        "Contact",
        back_populates="user",
        lazy="select",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"


class Contact(Base):
    """A person in the user's orbit."""

    __tablename__ = "contacts"

    __table_args__ = (Index("ix_contacts_user_id", "user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # circle: Family | Friends | Work | Network
    circle: Mapped[str] = mapped_column(String(20), nullable=False, default="Network")
    # status: active | paused | pending
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    # channel: email | call | message
    channel: Mapped[str] = mapped_column(String(20), nullable=False, default="email")
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Job title
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Keep-in-touch cadence in days; None means no cadence.
    stay_in_touch_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Max occurred_at of the contact's interactions, maintained by the interactions API.
    last_contacted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # Rows created by the sample seeder, so they can be removed in one go.
    is_sample: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=_utcnow, onupdate=_utcnow
    )

    user: Mapped[User] = relationship("User", back_populates="contacts")

    @property
    def reconnect_due_on(self) -> date | None:
        """Date the keep-in-touch cadence comes due, or None without a cadence."""
        if self.stay_in_touch_days is None:
            return None
        anchor = self.last_contacted_at or self.created_at
        return anchor.date() + timedelta(days=self.stay_in_touch_days)

    def __repr__(self) -> str:
        return f"<Contact(id={self.id}, name={self.name})>"


class Interaction(Base):
    """A logged touchpoint with a contact (call, email, message, meeting, other)."""

    __tablename__ = "interactions"

    __table_args__ = (
        Index("ix_interactions_user_id_occurred_at", "user_id", "occurred_at"),
        Index("ix_interactions_contact_id_occurred_at", "contact_id", "occurred_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    contact_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False
    )

    # kind: call | email | message | meeting | other
    kind: Mapped[str] = mapped_column(String(20), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=_utcnow, onupdate=_utcnow
    )

    # Joined eagerly so every response can carry contact_name without N+1 queries.
    contact: Mapped[Contact] = relationship("Contact", lazy="joined", innerjoin=True)

    def __repr__(self) -> str:
        return f"<Interaction(id={self.id}, contact_id={self.contact_id}, kind={self.kind})>"


class Reminder(Base):
    """A dated follow-up, optionally tied to a contact."""

    __tablename__ = "reminders"

    __table_args__ = (Index("ix_reminders_user_id_done_due_date", "user_id", "done", "due_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    contact_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    done: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    done_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=_utcnow, onupdate=_utcnow
    )

    contact: Mapped[Contact | None] = relationship("Contact", lazy="joined")

    def __repr__(self) -> str:
        return f"<Reminder(id={self.id}, title={self.title}, due_date={self.due_date})>"
