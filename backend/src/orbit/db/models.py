"""SQLAlchemy ORM models: User and Contact.

orbit is a single-user-scoped personal CRM. Every Contact belongs to a User;
all contact queries filter on user_id. Auth is OAuth-only (no passwords).
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
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
    last_interaction: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=_utcnow, onupdate=_utcnow
    )

    user: Mapped[User] = relationship("User", back_populates="contacts")

    def __repr__(self) -> str:
        return f"<Contact(id={self.id}, name={self.name})>"
