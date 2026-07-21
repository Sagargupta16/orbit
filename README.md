# orbit

Personal CRM -- the people in your orbit, managed. Track contacts, connections, and interactions in a tabular relationship dashboard.

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
