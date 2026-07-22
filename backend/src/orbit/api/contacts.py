"""Contacts CRUD endpoints. Every query is scoped to the current user."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from orbit.api.deps import CurrentUser, DatabaseSession
from orbit.db.models import Contact
from orbit.schemas.contacts import ContactCreate, ContactResponse, ContactUpdate

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


def _to_response(contact: Contact) -> ContactResponse:
    return ContactResponse(
        id=contact.id,
        name=contact.name,
        email=contact.email,
        circle=contact.circle,  # type: ignore[arg-type]
        status=contact.status,  # type: ignore[arg-type]
        channel=contact.channel,  # type: ignore[arg-type]
        last_interaction=contact.last_interaction,
        created_at=contact.created_at.isoformat(),
    )


@router.get("")
def list_contacts(current_user: CurrentUser, session: DatabaseSession) -> list[ContactResponse]:
    """List the current user's contacts, newest first."""
    rows = (
        session.execute(
            select(Contact)
            .where(Contact.user_id == current_user.id)
            .order_by(Contact.created_at.desc())
        )
        .scalars()
        .all()
    )
    return [_to_response(c) for c in rows]


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
    return _to_response(contact)


def _get_owned(contact_id: int, current_user: CurrentUser, session: DatabaseSession) -> Contact:
    contact = session.execute(
        select(Contact).where(Contact.id == contact_id, Contact.user_id == current_user.id)
    ).scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


@router.patch("/{contact_id}")
def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> ContactResponse:
    """Update one of the current user's contacts."""
    contact = _get_owned(contact_id, current_user, session)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    session.commit()
    session.refresh(contact)
    return _to_response(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> None:
    """Delete one of the current user's contacts."""
    contact = _get_owned(contact_id, current_user, session)
    session.delete(contact)
    session.commit()
