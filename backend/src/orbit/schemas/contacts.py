"""Contact Pydantic schemas, plus the bulk-delete and sample-data payloads."""

from datetime import date
from typing import Literal, Self

from pydantic import BaseModel, Field, model_validator

from orbit.schemas.common import OptionalText, RequiredName, reject_nulls

Circle = Literal["Family", "Friends", "Work", "Network"]
ContactStatus = Literal["active", "paused", "pending"]
Channel = Literal["email", "call", "message"]


class ContactCreate(BaseModel):
    """Payload to create a contact."""

    name: RequiredName
    email: OptionalText = Field(default=None, max_length=255)
    phone: OptionalText = Field(default=None, max_length=50)
    company: OptionalText = Field(default=None, max_length=255)
    title: OptionalText = Field(default=None, max_length=255)
    circle: Circle = "Network"
    status: ContactStatus = "active"
    channel: Channel = "email"
    birthday: date | None = None
    notes: OptionalText = None
    stay_in_touch_days: int | None = Field(default=None, ge=1, le=3650)


class ContactUpdate(BaseModel):
    """Partial update payload: only the fields sent are changed."""

    name: RequiredName | None = None
    email: OptionalText = Field(default=None, max_length=255)
    phone: OptionalText = Field(default=None, max_length=50)
    company: OptionalText = Field(default=None, max_length=255)
    title: OptionalText = Field(default=None, max_length=255)
    circle: Circle | None = None
    status: ContactStatus | None = None
    channel: Channel | None = None
    birthday: date | None = None
    notes: OptionalText = None
    stay_in_touch_days: int | None = Field(default=None, ge=1, le=3650)

    @model_validator(mode="after")
    def _required_fields_not_null(self) -> Self:
        reject_nulls(self, ("name", "circle", "status", "channel"))
        return self


class ContactResponse(BaseModel):
    """Contact as returned by the API."""

    id: int
    name: str
    email: str | None
    phone: str | None
    company: str | None
    title: str | None
    circle: Circle
    status: ContactStatus
    channel: Channel
    birthday: date | None
    notes: str | None
    stay_in_touch_days: int | None
    last_contacted_at: str | None
    reconnect_due_on: date | None
    is_sample: bool
    created_at: str
    updated_at: str


class BulkDeleteRequest(BaseModel):
    """Contact ids to delete; ids the user does not own are ignored."""

    ids: list[int]


class BulkDeleteResponse(BaseModel):
    deleted: int


class SampleCounts(BaseModel):
    """Rows created by POST /api/samples."""

    contacts: int
    interactions: int
    reminders: int


class SamplesDeleted(BaseModel):
    """Result of DELETE /api/samples."""

    deleted_contacts: int
