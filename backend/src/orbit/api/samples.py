"""Sample data endpoints: add or remove the demo orbit for the current user."""

from datetime import date

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, true

from orbit.api.deps import CurrentUser, DatabaseSession
from orbit.db.models import Contact
from orbit.schemas.common import utc_today
from orbit.schemas.contacts import SampleCounts, SamplesDeleted
from orbit.services.samples import create_samples, delete_samples

router = APIRouter(prefix="/api/samples", tags=["samples"])


@router.post("", status_code=status.HTTP_201_CREATED)
def add_samples(
    current_user: CurrentUser,
    session: DatabaseSession,
    today: date | None = None,
) -> SampleCounts:
    """Create the sample contacts, interactions and reminders (409 if already there)."""
    existing = session.execute(
        select(Contact.id)
        .where(Contact.user_id == current_user.id, Contact.is_sample == true())
        .limit(1)
    ).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Sample data is already loaded. Remove it before adding it again.",
        )
    counts = create_samples(session, current_user, today or utc_today())
    session.commit()
    return counts


@router.delete("")
def remove_samples(current_user: CurrentUser, session: DatabaseSession) -> SamplesDeleted:
    """Delete every sample contact; their interactions and reminders cascade."""
    deleted = delete_samples(session, current_user)
    session.commit()
    return SamplesDeleted(deleted_contacts=deleted)
