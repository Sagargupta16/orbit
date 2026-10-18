"""Dashboard Pydantic schemas."""

from datetime import date

from pydantic import BaseModel

from orbit.schemas.contacts import Circle
from orbit.schemas.interactions import InteractionResponse
from orbit.schemas.reminders import ReminderResponse


class DashboardTotals(BaseModel):
    contacts: int
    interactions_30d: int
    open_reminders: int
    overdue_reminders: int
    # Contacts whose keep-in-touch cadence is due on or before today.
    reconnect_due: int


class CircleCount(BaseModel):
    circle: Circle
    count: int


class ReconnectItem(BaseModel):
    contact_id: int
    name: str
    circle: Circle
    last_contacted_at: str | None
    due_on: date
    days_overdue: int


class BirthdayItem(BaseModel):
    contact_id: int
    name: str
    birthday: date
    next_on: date
    days_until: int


class DashboardResponse(BaseModel):
    totals: DashboardTotals
    circles: list[CircleCount]
    recent_interactions: list[InteractionResponse]
    upcoming_reminders: list[ReminderResponse]
    reconnect: list[ReconnectItem]
    birthdays: list[BirthdayItem]
