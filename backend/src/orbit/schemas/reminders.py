"""Reminder Pydantic schemas."""

from datetime import date
from typing import Literal, Self

from pydantic import BaseModel, model_validator

from orbit.schemas.common import OptionalText, RequiredName, reject_nulls

ReminderStatusFilter = Literal["open", "done", "all"]


class ReminderCreate(BaseModel):
    """Payload to create a reminder, optionally tied to a contact."""

    title: RequiredName
    due_date: date
    contact_id: int | None = None
    notes: OptionalText = None


class ReminderUpdate(BaseModel):
    """Partial update payload. done=true stamps done_at, done=false clears it."""

    title: RequiredName | None = None
    due_date: date | None = None
    contact_id: int | None = None
    notes: OptionalText = None
    done: bool | None = None

    @model_validator(mode="after")
    def _required_fields_not_null(self) -> Self:
        reject_nulls(self, ("title", "due_date", "done"))
        return self


class ReminderResponse(BaseModel):
    """Reminder as returned by the API."""

    id: int
    title: str
    due_date: date
    notes: str | None
    done: bool
    done_at: str | None
    contact_id: int | None
    contact_name: str | None
    created_at: str
