# orbit

Personal CRM -- the people in your orbit, managed. Track contacts, connections, and interactions in a tabular relationship dashboard.

Live at [sagargupta.online/orbit](https://sagargupta.online/orbit/). Sign in with GitHub.

## What it does

- **Dashboard**: who to reach out to today, upcoming reminders and birthdays, recent activity, circle sizes.
- **Contacts**: add, edit, delete, search and filter; a detail page with each person's timeline and reminders. A one-click sample data set, removable in one click.
- **Interactions**: log calls, emails, messages and meetings. Logging one updates when you last contacted that person.
- **Keep in touch**: set a cadence (every N days) on a contact, and orbit tells you when they are due.
- **Reminders**: one-off reminders, optionally tied to a contact.
- **Circles**: Family, Friends, Work and Network, with members and who is due.

Works on phones: lists become cards, dialogs become bottom sheets. See [docs/ROADMAP.md](docs/ROADMAP.md) for what comes next.

## Stack

- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2, Alembic (uv)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4 (pnpm)
- **Database**: SQLite (dev), Neon PostgreSQL (prod)

## Quick start

```bash
pnpm install        # root tooling (concurrently)
pnpm run setup      # backend uv sync + frontend pnpm install
pnpm run dev        # backend :8000 + frontend :5173
```

API docs at http://localhost:8000/docs once the backend is up.

## Checks

```bash
pnpm run check      # lint + type-check + test, both stacks
```

## License

MIT
