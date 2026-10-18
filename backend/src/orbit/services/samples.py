"""Sample data: a realistic orbit a new user can add and remove in one click.

Every contact is created with is_sample=True. Interactions and reminders hang
off those contacts, so deleting the sample contacts cascades them away too.
Dates are relative to the client's "today" so the dashboard always has
something due, overdue and coming up.
"""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import NamedTuple

from sqlalchemy import delete, true
from sqlalchemy.orm import Session

from orbit.db.models import Contact, Interaction, Reminder, User
from orbit.schemas.contacts import SampleCounts


@dataclass(frozen=True)
class _SampleContact:
    name: str
    email: str
    circle: str
    status: str
    channel: str
    company: str | None = None
    title: str | None = None
    phone: str | None = None
    stay_in_touch_days: int | None = None
    # Birthday lands this many days after today; birth years are leap years so
    # a Feb 29 target is always a valid date.
    birthday_in_days: int | None = None
    birth_year: int = 1992
    notes: str | None = None


class _SampleInteraction(NamedTuple):
    contact: int  # index into SAMPLE_CONTACTS
    kind: str
    days_ago: int
    hour: int
    notes: str | None


class _SampleReminder(NamedTuple):
    contact: int  # index into SAMPLE_CONTACTS
    title: str
    due_in_days: int  # negative is overdue


# Same people as the old frontend seeder, now with full profiles.
SAMPLE_CONTACTS: tuple[_SampleContact, ...] = (
    _SampleContact(
        "Sebastian Gray",
        "sebastian.gray@gmail.com",
        "Work",
        "active",
        "call",
        company="Northwind Labs",
        title="Engineering Manager",
        phone="+1 415 555 0142",
        stay_in_touch_days=14,
        notes="Met at the platform summit. Prefers calls after 4 pm.",
    ),
    _SampleContact(
        "Hunter Brooks",
        "hunter.brooks@outlook.com",
        "Friends",
        "paused",
        "message",
        phone="+1 646 555 0187",
        stay_in_touch_days=30,
        birthday_in_days=5,
        birth_year=1988,
    ),
    _SampleContact(
        "Lucas Anderson",
        "lucas.a@company.io",
        "Network",
        "active",
        "email",
        company="Brightline",
        title="Product Designer",
    ),
    _SampleContact(
        "Nathan Phillips",
        "nathan.phillips@company.io",
        "Network",
        "paused",
        "email",
        company="Brightline",
        title="Head of Sales",
    ),
    _SampleContact(
        "Aaron Butler",
        "aaron.butler@gmail.com",
        "Friends",
        "paused",
        "call",
        phone="+1 312 555 0119",
        stay_in_touch_days=21,
        birthday_in_days=12,
        birth_year=1996,
    ),
    _SampleContact(
        "Benjamin Scott",
        "ben.scott@work.com",
        "Work",
        "active",
        "call",
        company="Acme Analytics",
        title="Staff Engineer",
        stay_in_touch_days=7,
    ),
    _SampleContact(
        "Elijah Harris",
        "elijah.harris@gmail.com",
        "Friends",
        "active",
        "message",
        company="Harris Studio",
        title="Photographer",
        birthday_in_days=26,
    ),
    _SampleContact(
        "Joshua Murphy",
        "joshua.murphy@company.io",
        "Network",
        "active",
        "call",
        company="Lumen Health",
        title="Founder",
        stay_in_touch_days=60,
    ),
    _SampleContact(
        "William Young",
        "will.young@work.com",
        "Work",
        "active",
        "call",
        company="Acme Analytics",
        title="Recruiter",
    ),
    _SampleContact(
        "Mason Thompson",
        "mason.t@gmail.com",
        "Family",
        "active",
        "call",
        phone="+1 917 555 0163",
        stay_in_touch_days=7,
        birthday_in_days=2,
        birth_year=1964,
        notes="Sunday evening calls.",
    ),
    _SampleContact(
        "Aiden Parker",
        "aiden.parker@company.io",
        "Network",
        "pending",
        "email",
        company="Fernway Capital",
        title="Partner",
    ),
    _SampleContact(
        "Jackson Brooks",
        "jackson.brooks@gmail.com",
        "Family",
        "paused",
        "message",
        birthday_in_days=120,
        birth_year=2000,
    ),
)

SAMPLE_INTERACTIONS: tuple[_SampleInteraction, ...] = (
    _SampleInteraction(0, "call", 20, 16, "Caught up on the Q4 roadmap."),
    _SampleInteraction(0, "email", 34, 10, "Sent the intro deck."),
    _SampleInteraction(0, "meeting", 52, 13, "Coffee near the office."),
    _SampleInteraction(1, "message", 45, 21, "Planning the hiking trip."),
    _SampleInteraction(2, "email", 6, 9, "Feedback on the onboarding flow."),
    _SampleInteraction(2, "meeting", 27, 15, "Design review."),
    _SampleInteraction(3, "email", 40, 11, "Followed up on the pricing proposal."),
    _SampleInteraction(4, "call", 10, 19, "Birthday dinner plans."),
    _SampleInteraction(4, "message", 31, 20, "Shared match tickets."),
    _SampleInteraction(5, "call", 3, 14, "Pairing session on the API."),
    _SampleInteraction(5, "meeting", 17, 12, "Lunch."),
    _SampleInteraction(6, "message", 2, 18, "Sent photos from the shoot."),
    _SampleInteraction(6, "call", 38, 17, None),
    _SampleInteraction(7, "meeting", 58, 10, "Pitch practice."),
    _SampleInteraction(8, "email", 12, 9, "Referral for the platform role."),
    _SampleInteraction(8, "call", 47, 16, None),
    _SampleInteraction(9, "call", 9, 20, "Weekly family call."),
    _SampleInteraction(9, "call", 16, 20, "Weekly family call."),
    _SampleInteraction(10, "email", 25, 8, "Sent the investor update."),
    _SampleInteraction(11, "other", 55, 12, "Dropped off the books."),
)

SAMPLE_REMINDERS: tuple[_SampleReminder, ...] = (
    _SampleReminder(3, "Send Nathan the revised proposal", -4),
    _SampleReminder(1, "Book the cabin with Hunter", -1),
    _SampleReminder(9, "Call Mason about the weekend", 0),
    _SampleReminder(1, "Wish Hunter a happy birthday", 5),
    _SampleReminder(10, "Follow up with Aiden on the term sheet", 7),
    _SampleReminder(0, "Prep the quarterly sync with Sebastian", 14),
)


def _birthday(spec: _SampleContact, today: date) -> date | None:
    if spec.birthday_in_days is None:
        return None
    target = today + timedelta(days=spec.birthday_in_days)
    return date(spec.birth_year, target.month, target.day)


def create_samples(session: Session, user: User, today: date) -> SampleCounts:
    """Add the sample contacts, interactions and reminders for ``user`` (no commit)."""
    contacts = [
        Contact(
            user_id=user.id,
            is_sample=True,
            name=spec.name,
            email=spec.email,
            circle=spec.circle,
            status=spec.status,
            channel=spec.channel,
            company=spec.company,
            title=spec.title,
            phone=spec.phone,
            stay_in_touch_days=spec.stay_in_touch_days,
            birthday=_birthday(spec, today),
            notes=spec.notes,
        )
        for spec in SAMPLE_CONTACTS
    ]
    session.add_all(contacts)
    session.flush()  # assign contact ids

    interactions: list[Interaction] = []
    for item in SAMPLE_INTERACTIONS:
        contact = contacts[item.contact]
        occurred_at = datetime.combine(today - timedelta(days=item.days_ago), time(hour=item.hour))
        interactions.append(
            Interaction(
                user_id=user.id,
                contact_id=contact.id,
                kind=item.kind,
                occurred_at=occurred_at,
                notes=item.notes,
            )
        )
        if contact.last_contacted_at is None or occurred_at > contact.last_contacted_at:
            contact.last_contacted_at = occurred_at

    reminders = [
        Reminder(
            user_id=user.id,
            contact_id=contacts[item.contact].id,
            title=item.title,
            due_date=today + timedelta(days=item.due_in_days),
        )
        for item in SAMPLE_REMINDERS
    ]
    session.add_all(interactions)
    session.add_all(reminders)
    session.flush()
    return SampleCounts(
        contacts=len(contacts), interactions=len(interactions), reminders=len(reminders)
    )


def delete_samples(session: Session, user: User) -> int:
    """Delete every sample contact of ``user`` (no commit); returns the count.

    Their interactions and reminders go with them via ON DELETE CASCADE.
    """
    deleted_ids = session.execute(
        delete(Contact)
        .where(Contact.user_id == user.id, Contact.is_sample == true())
        .returning(Contact.id)
    ).scalars()
    return len(deleted_ids.all())
