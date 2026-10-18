"""Dashboard endpoint: totals, circles, recent activity, reconnects, birthdays.

"Today" comes from the client (?today=YYYY-MM-DD) and defaults to the UTC date.
"""

import calendar
from datetime import date, datetime, time, timedelta
from typing import get_args

from fastapi import APIRouter
from sqlalchemy import false, func, select

from orbit.api.deps import CurrentUser, DatabaseSession
from orbit.api.interactions import interaction_response
from orbit.api.reminders import reminder_response
from orbit.db.models import Contact, Interaction, Reminder
from orbit.schemas.common import iso_utc_or_none, utc_today
from orbit.schemas.contacts import Circle
from orbit.schemas.dashboard import (
    BirthdayItem,
    CircleCount,
    DashboardResponse,
    DashboardTotals,
    ReconnectItem,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

_LIST_SIZE = 5
_BIRTHDAY_WINDOW_DAYS = 30
_INTERACTION_WINDOW_DAYS = 30


def _birthday_in(birthday: date, year: int) -> date:
    """The birthday's date in ``year``; Feb 29 falls on Feb 28 in non-leap years."""
    if birthday.month == 2 and birthday.day == 29 and not calendar.isleap(year):
        return date(year, 2, 28)
    return birthday.replace(year=year)


def _next_birthday(birthday: date, today: date) -> date:
    candidate = _birthday_in(birthday, today.year)
    if candidate < today:
        candidate = _birthday_in(birthday, today.year + 1)
    return candidate


@router.get("")
def get_dashboard(
    current_user: CurrentUser,
    session: DatabaseSession,
    today: date | None = None,
) -> DashboardResponse:
    """Summarise the current user's orbit as of ``today``."""
    today = today or utc_today()
    user_id = current_user.id

    circle_counts: dict[str, int] = {
        circle: count
        for circle, count in session.execute(
            select(Contact.circle, func.count())
            .where(Contact.user_id == user_id)
            .group_by(Contact.circle)
        ).tuples()
    }

    window_start = datetime.combine(today - timedelta(days=_INTERACTION_WINDOW_DAYS), time.min)
    window_end = datetime.combine(today + timedelta(days=1), time.min)
    interactions_30d = session.execute(
        select(func.count()).where(
            Interaction.user_id == user_id,
            Interaction.occurred_at >= window_start,
            Interaction.occurred_at < window_end,
        )
    ).scalar_one()

    open_reminders_filter = (Reminder.user_id == user_id, Reminder.done == false())
    open_reminders = session.execute(
        select(func.count()).where(*open_reminders_filter)
    ).scalar_one()
    overdue_reminders = session.execute(
        select(func.count()).where(*open_reminders_filter, Reminder.due_date < today)
    ).scalar_one()

    recent = (
        session.execute(
            select(Interaction)
            .where(Interaction.user_id == user_id)
            .order_by(Interaction.occurred_at.desc(), Interaction.id.desc())
            .limit(_LIST_SIZE)
        )
        .scalars()
        .all()
    )
    upcoming = (
        session.execute(
            select(Reminder)
            .where(*open_reminders_filter)
            .order_by(Reminder.due_date.asc(), Reminder.id.asc())
            .limit(_LIST_SIZE)
        )
        .scalars()
        .all()
    )

    # Cadence and birthday math stays in Python: date arithmetic differs between
    # SQLite and PostgreSQL, and one user's contact list is small.
    due: list[tuple[Contact, date]] = []
    for contact in session.execute(
        select(Contact).where(Contact.user_id == user_id, Contact.stay_in_touch_days.is_not(None))
    ).scalars():
        due_on = contact.reconnect_due_on
        if due_on is not None and due_on <= today:
            due.append((contact, due_on))
    due.sort(key=lambda item: (item[1], item[0].name))

    birthdays: list[BirthdayItem] = []
    for contact in session.execute(
        select(Contact).where(Contact.user_id == user_id, Contact.birthday.is_not(None))
    ).scalars():
        if contact.birthday is None:
            continue
        next_on = _next_birthday(contact.birthday, today)
        days_until = (next_on - today).days
        if days_until <= _BIRTHDAY_WINDOW_DAYS:
            birthdays.append(
                BirthdayItem(
                    contact_id=contact.id,
                    name=contact.name,
                    birthday=contact.birthday,
                    next_on=next_on,
                    days_until=days_until,
                )
            )
    birthdays.sort(key=lambda item: (item.days_until, item.name))

    return DashboardResponse(
        totals=DashboardTotals(
            contacts=sum(circle_counts.values()),
            interactions_30d=interactions_30d,
            open_reminders=open_reminders,
            overdue_reminders=overdue_reminders,
            reconnect_due=len(due),
        ),
        circles=[
            CircleCount(circle=circle, count=circle_counts.get(circle, 0))
            for circle in get_args(Circle)
        ],
        recent_interactions=[interaction_response(i) for i in recent],
        upcoming_reminders=[reminder_response(r) for r in upcoming],
        reconnect=[
            ReconnectItem(
                contact_id=contact.id,
                name=contact.name,
                circle=contact.circle,  # type: ignore[arg-type]
                last_contacted_at=iso_utc_or_none(contact.last_contacted_at),
                due_on=due_on,
                days_overdue=(today - due_on).days,
            )
            for contact, due_on in due[:_LIST_SIZE]
        ],
        birthdays=birthdays,
    )
