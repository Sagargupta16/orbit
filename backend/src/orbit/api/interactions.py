"""Interaction log endpoints. Every query is scoped to the current user.

After every create, update and delete the contact's last_contacted_at is
recomputed as the max occurred_at of its interactions (None when none are left).
"""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from orbit.api.contacts import get_owned_contact
from orbit.api.deps import CurrentUser, DatabaseSession
from orbit.db.models import Contact, Interaction, User
from orbit.schemas.common import iso_utc, to_naive_utc, utcnow_naive
from orbit.schemas.interactions import InteractionCreate, InteractionResponse, InteractionUpdate

router = APIRouter(prefix="/api/interactions", tags=["interactions"])


def interaction_response(interaction: Interaction) -> InteractionResponse:
    return InteractionResponse(
        id=interaction.id,
        contact_id=interaction.contact_id,
        contact_name=interaction.contact.name,
        kind=interaction.kind,  # type: ignore[arg-type]
        occurred_at=iso_utc(interaction.occurred_at),
        notes=interaction.notes,
        created_at=iso_utc(interaction.created_at),
    )


def _refresh_last_contacted(session: Session, contact: Contact) -> None:
    """Set the contact's last_contacted_at to its newest interaction's occurred_at."""
    session.flush()
    contact.last_contacted_at = session.execute(
        select(func.max(Interaction.occurred_at)).where(Interaction.contact_id == contact.id)
    ).scalar_one()


def _get_owned(session: Session, user: User, interaction_id: int) -> Interaction:
    interaction = session.execute(
        select(Interaction).where(Interaction.id == interaction_id, Interaction.user_id == user.id)
    ).scalar_one_or_none()
    if interaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interaction not found")
    return interaction


@router.get("")
def list_interactions(
    current_user: CurrentUser,
    session: DatabaseSession,
    contact_id: int | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    before: datetime | None = None,
) -> list[InteractionResponse]:
    """List interactions newest first; ``before`` is an occurred_at cursor."""
    stmt = select(Interaction).where(Interaction.user_id == current_user.id)
    if contact_id is not None:
        stmt = stmt.where(Interaction.contact_id == contact_id)
    if before is not None:
        stmt = stmt.where(Interaction.occurred_at < to_naive_utc(before))
    stmt = stmt.order_by(Interaction.occurred_at.desc(), Interaction.id.desc()).limit(limit)
    return [interaction_response(i) for i in session.execute(stmt).scalars()]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_interaction(
    payload: InteractionCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> InteractionResponse:
    """Log an interaction with one of the current user's contacts."""
    contact = get_owned_contact(session, current_user, payload.contact_id)
    interaction = Interaction(
        user_id=current_user.id,
        contact_id=contact.id,
        kind=payload.kind,
        occurred_at=payload.occurred_at or utcnow_naive(),
        notes=payload.notes,
    )
    session.add(interaction)
    _refresh_last_contacted(session, contact)
    session.commit()
    session.refresh(interaction)
    return interaction_response(interaction)


@router.patch("/{interaction_id}")
def update_interaction(
    interaction_id: int,
    payload: InteractionUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> InteractionResponse:
    """Update one of the current user's interactions."""
    interaction = _get_owned(session, current_user, interaction_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(interaction, field, value)
    _refresh_last_contacted(session, interaction.contact)
    session.commit()
    session.refresh(interaction)
    return interaction_response(interaction)


@router.delete("/{interaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interaction(
    interaction_id: int,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> None:
    """Delete one of the current user's interactions."""
    interaction = _get_owned(session, current_user, interaction_id)
    contact = interaction.contact
    session.delete(interaction)
    _refresh_last_contacted(session, contact)
    session.commit()
