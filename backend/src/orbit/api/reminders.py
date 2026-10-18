"""Reminder endpoints. Every query is scoped to the current user."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import false, select, true
from sqlalchemy.orm import Session

from orbit.api.contacts import get_owned_contact
from orbit.api.deps import CurrentUser, DatabaseSession
from orbit.db.models import Reminder, User
from orbit.schemas.common import iso_utc, iso_utc_or_none, utcnow_naive
from orbit.schemas.reminders import (
    ReminderCreate,
    ReminderResponse,
    ReminderStatusFilter,
    ReminderUpdate,
)

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


def reminder_response(reminder: Reminder) -> ReminderResponse:
    return ReminderResponse(
        id=reminder.id,
        title=reminder.title,
        due_date=reminder.due_date,
        notes=reminder.notes,
        done=reminder.done,
        done_at=iso_utc_or_none(reminder.done_at),
        contact_id=reminder.contact_id,
        contact_name=reminder.contact.name if reminder.contact is not None else None,
        created_at=iso_utc(reminder.created_at),
    )


def _get_owned(session: Session, user: User, reminder_id: int) -> Reminder:
    reminder = session.execute(
        select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user.id)
    ).scalar_one_or_none()
    if reminder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    return reminder


@router.get("")
def list_reminders(
    current_user: CurrentUser,
    session: DatabaseSession,
    status_filter: Annotated[ReminderStatusFilter, Query(alias="status")] = "open",
    contact_id: int | None = None,
) -> list[ReminderResponse]:
    """List reminders: open ones by due_date ascending, done ones by done_at descending."""
    base = select(Reminder).where(Reminder.user_id == current_user.id)
    if contact_id is not None:
        base = base.where(Reminder.contact_id == contact_id)
    rows: list[Reminder] = []
    if status_filter in ("open", "all"):
        open_stmt = base.where(Reminder.done == false()).order_by(
            Reminder.due_date.asc(), Reminder.id.asc()
        )
        rows.extend(session.execute(open_stmt).scalars())
    if status_filter in ("done", "all"):
        done_stmt = base.where(Reminder.done == true()).order_by(
            Reminder.done_at.desc(), Reminder.id.desc()
        )
        rows.extend(session.execute(done_stmt).scalars())
    return [reminder_response(r) for r in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: ReminderCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> ReminderResponse:
    """Create a reminder, optionally tied to one of the current user's contacts."""
    if payload.contact_id is not None:
        get_owned_contact(session, current_user, payload.contact_id)
    reminder = Reminder(
        user_id=current_user.id,
        contact_id=payload.contact_id,
        title=payload.title,
        due_date=payload.due_date,
        notes=payload.notes,
    )
    session.add(reminder)
    session.commit()
    session.refresh(reminder)
    return reminder_response(reminder)


@router.patch("/{reminder_id}")
def update_reminder(
    reminder_id: int,
    payload: ReminderUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> ReminderResponse:
    """Update a reminder. done=true stamps done_at (once), done=false clears it."""
    reminder = _get_owned(session, current_user, reminder_id)
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("contact_id") is not None:
        get_owned_contact(session, current_user, updates["contact_id"])
    done = updates.pop("done", None)
    for field, value in updates.items():
        setattr(reminder, field, value)
    if done is True and not reminder.done:
        reminder.done = True
        reminder.done_at = utcnow_naive()
    elif done is False:
        reminder.done = False
        reminder.done_at = None
    session.commit()
    session.refresh(reminder)
    return reminder_response(reminder)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> None:
    """Delete one of the current user's reminders."""
    reminder = _get_owned(session, current_user, reminder_id)
    session.delete(reminder)
    session.commit()
