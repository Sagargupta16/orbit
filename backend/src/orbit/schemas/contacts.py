"""Contact Pydantic schemas."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

Circle = Literal["Family", "Friends", "Work", "Network"]
ContactStatus = Literal["active", "paused", "pending"]
Channel = Literal["email", "call", "message"]


class ContactBase(BaseModel):
    """Shared contact fields."""

    name: str
    email: str | None = None
    circle: Circle = "Network"
    status: ContactStatus = "active"
    channel: Channel = "email"
    last_interaction: str | None = None


class ContactCreate(ContactBase):
    """Payload to create a contact."""


class ContactUpdate(BaseModel):
    """Partial update payload."""

    name: str | None = None
    email: str | None = None
    circle: Circle | None = None
    status: ContactStatus | None = None
    channel: Channel | None = None
    last_interaction: str | None = None


class ContactResponse(ContactBase):
    """Contact as returned by the API."""

    id: int
    created_at: str

    model_config = ConfigDict(from_attributes=True)
