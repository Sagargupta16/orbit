"""Contacts CRUD endpoints. Every query is scoped to the current user."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from orbit.api.deps import CurrentUser, DatabaseSession
from orbit.db.models import Contact, User
from orbit.schemas.common import iso_utc, iso_utc_or_none
from orbit.schemas.contacts import (
    BulkDeleteRequest,
    BulkDeleteResponse,
    Circle,
    ContactCreate,
    ContactResponse,
    ContactStatus,
    ContactUpdate,
)

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


def contact_response(contact: Contact) -> ContactResponse:
    return ContactResponse(
        id=contact.id,
        name=contact.name,
        email=contact.email,
        phone=contact.phone,
        company=contact.company,
        title=contact.title,
        circle=contact.circle,  # type: ignore[arg-type]
        status=contact.status,  # type: ignore[arg-type]
        channel=contact.channel,  # type: ignore[arg-type]
        birthday=contact.birthday,
        notes=contact.notes,
        stay_in_touch_days=contact.stay_in_touch_days,
        last_contacted_at=iso_utc_or_none(contact.last_contacted_at),
        reconnect_due_on=contact.reconnect_due_on,
        is_sample=contact.is_sample,
        created_at=iso_utc(contact.created_at),
        updated_at=iso_utc(contact.updated_at),
    )


def get_owned_contact(session: Session, user: User, contact_id: int) -> Contact:
    """Return the user's contact, or 404 (another user's row is a 404 too)."""
    contact = session.execute(
        select(Contact).where(Contact.id == contact_id, Contact.user_id == user.id)
    ).scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


@router.get("")
def list_contacts(
    current_user: CurrentUser,
    session: DatabaseSession,
    q: str | None = None,
    circle: Circle | None = None,
    status_filter: Annotated[ContactStatus | None, Query(alias="status")] = None,
) -> list[ContactResponse]:
    """List the current user's contacts, newest first.

    ``q`` matches name, email, company or notes, case-insensitive.
    """
    stmt = select(Contact).where(Contact.user_id == current_user.id)
    if q and q.strip():
        term = q.strip()
        stmt = stmt.where(
            or_(
                Contact.name.icontains(term, autoescape=True),
                Contact.email.icontains(term, autoescape=True),
                Contact.company.icontains(term, autoescape=True),
                Contact.notes.icontains(term, autoescape=True),
            )
        )
    if circle is not None:
        stmt = stmt.where(Contact.circle == circle)
    if status_filter is not None:
        stmt = stmt.where(Contact.status == status_filter)
    rows = session.execute(stmt.order_by(Contact.created_at.desc(), Contact.id.desc())).scalars()
    return [contact_response(c) for c in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_contact(
    payload: ContactCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> ContactResponse:
    """Create a contact owned by the current user."""
    contact = Contact(user_id=current_user.id, **payload.model_dump())
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact_response(contact)


@router.post("/bulk-delete")
def bulk_delete_contacts(
    payload: BulkDeleteRequest,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> BulkDeleteResponse:
    """Delete many of the current user's contacts; ids not owned are ignored."""
    if not payload.ids:
        return BulkDeleteResponse(deleted=0)
    deleted_ids = (
        session.execute(
            delete(Contact)
            .where(Contact.user_id == current_user.id, Contact.id.in_(payload.ids))
            .returning(Contact.id)
        )
        .scalars()
        .all()
    )
    session.commit()
    return BulkDeleteResponse(deleted=len(deleted_ids))


@router.get("/{contact_id}")
def get_contact(
    contact_id: int,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> ContactResponse:
    """Return one of the current user's contacts."""
    return contact_response(get_owned_contact(session, current_user, contact_id))


@router.patch("/{contact_id}")
def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> ContactResponse:
    """Update one of the current user's contacts."""
    contact = get_owned_contact(session, current_user, contact_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    session.commit()
    session.refresh(contact)
    return contact_response(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> None:
    """Delete one of the current user's contacts (interactions and reminders cascade)."""
    contact = get_owned_contact(session, current_user, contact_id)
    session.delete(contact)
    session.commit()
