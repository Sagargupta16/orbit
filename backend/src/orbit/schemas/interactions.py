"""Interaction Pydantic schemas."""

from typing import Literal, Self

from pydantic import BaseModel, model_validator

from orbit.schemas.common import OptionalText, UtcDatetime, reject_nulls

InteractionKind = Literal["call", "email", "message", "meeting", "other"]


class InteractionCreate(BaseModel):
    """Payload to log an interaction; occurred_at defaults to now."""

    contact_id: int
    kind: InteractionKind
    occurred_at: UtcDatetime | None = None
    notes: OptionalText = None


class InteractionUpdate(BaseModel):
    """Partial update payload: only the fields sent are changed."""

    kind: InteractionKind | None = None
    occurred_at: UtcDatetime | None = None
    notes: OptionalText = None

    @model_validator(mode="after")
    def _required_fields_not_null(self) -> Self:
        reject_nulls(self, ("kind", "occurred_at"))
        return self


class InteractionResponse(BaseModel):
    """Interaction as returned by the API."""

    id: int
    contact_id: int
    contact_name: str
    kind: InteractionKind
    occurred_at: str
    notes: str | None
    created_at: str
