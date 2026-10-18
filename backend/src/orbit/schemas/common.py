"""Shared schema helpers: UTC datetime conversion and input normalisation.

Datetimes are stored naive UTC. Responses send them as ISO 8601 with a trailing
``Z``; requests may carry any offset (or ``Z``) and are converted to naive UTC.
"""

from datetime import UTC, date, datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, BeforeValidator, StringConstraints


def to_naive_utc(value: datetime) -> datetime:
    """Convert an aware datetime to naive UTC; a naive one is taken as UTC already."""
    if value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


def iso_utc(value: datetime) -> str:
    """Render a stored datetime as ISO 8601 UTC with a trailing Z."""
    return f"{to_naive_utc(value).isoformat()}Z"


def iso_utc_or_none(value: datetime | None) -> str | None:
    return None if value is None else iso_utc(value)


def utcnow_naive() -> datetime:
    """Current time as naive UTC, the storage convention."""
    return datetime.now(UTC).replace(tzinfo=None)


def utc_today() -> date:
    """Default "today" when the client does not send ?today=."""
    return datetime.now(UTC).date()


def _blank_to_none(value: object) -> object:
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    return value


def reject_nulls(model: BaseModel, fields: tuple[str, ...]) -> None:
    """Fail a partial update that explicitly sends null for a NOT NULL field."""
    for field in fields:
        if field in model.model_fields_set and getattr(model, field) is None:
            raise ValueError(f"{field} may not be null")


# Required text: stripped, 1..255 characters.
RequiredName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)
]
# Optional text: stripped, and blank becomes None. Pair with Field(max_length=...).
OptionalText = Annotated[str | None, BeforeValidator(_blank_to_none)]
# Request datetime with any offset, stored as naive UTC.
UtcDatetime = Annotated[datetime, AfterValidator(to_naive_utc)]
