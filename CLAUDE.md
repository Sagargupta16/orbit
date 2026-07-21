# CLAUDE.md

> This file stacks on top of the workspace root at `C:\Code\GitHub\`:
> - Root [`CLAUDE.md`](../../CLAUDE.md) -- voice, rules, routing map, references, skills, slash commands, conventions.
> - Root [`MEMORY.md`](../../MEMORY.md) -- live facts across repos.
> - Root [`STATUS.md`](../../STATUS.md) -- live PR/CI/security dashboard.
> - [`.claude/resources/`](../../.claude/resources/README.md) -- deep reference for collaboration, workflow, git, OSS, debugging, voice.
>
> Read those first. The guidance below only adds **repo-specific context** -- it does not override anything in the root.

## Project

orbit is a personal CRM: contacts, connections, and interaction tracking in a tabular relationship dashboard. Single-user-scoped data behind OAuth, same operating model as ledger-sync.

Planned deploy: frontend on GitHub Pages (`sagargupta.online/orbit/`), backend on Vercel serverless, Neon PostgreSQL.

## Stack

- **Language**: Python 3.13 (backend), TypeScript (frontend)
- **Framework**: FastAPI + SQLAlchemy 2 + Alembic / React 19 + Vite + Tailwind CSS 4
- **Database**: SQLite dev (`./orbit.db`), Neon PostgreSQL prod
- **Package manager**: uv (backend), pnpm (frontend + root)
- **Deploy target**: GitHub Pages + Vercel (not yet wired)

## Run

```
pnpm install && pnpm run setup
pnpm run dev          # backend :8000, frontend :5173, /api proxied
pnpm run build        # frontend production build
```

## Test

```
pnpm run check        # lint + type-check + test (both stacks)
cd backend && uv run pytest tests/ -v
```

## Entry points

- `backend/src/orbit/api/main.py` -- FastAPI app, routers register here
- `frontend/src/main.tsx` -- React root
- `frontend/src/App.tsx` -- app shell (router lands here later)

## Key files

- `backend/src/orbit/config/settings.py` -- pydantic BaseSettings, all env vars prefixed `ORBIT_`
- `frontend/vite.config.ts` -- `@/` alias, `/api` proxy, GH Pages base path via `GITHUB_PAGES=true`

## Gotchas

- Frontend package deps live in `frontend/package.json`; root `package.json` only has `concurrently`. Run installs in the right directory.
- `GITHUB_PAGES=true` flips Vite `base` to `/orbit/` -- production links break if forgotten in the deploy workflow.
- mypy runs in strict mode from `pyproject.toml` (`uv run mypy`, no path args needed).

## Repo-specific rules

- Follow ledger-sync patterns for anything not specified here: routers in `api/`, business logic in `core/`, schemas in `schemas/`, user-scoped queries, database-agnostic SQL, PageContainer/DataTable-style shared UI primitives once they exist.
- Mobile-first: tables must degrade to stacked cards on phones (most users are on phones).
- No new npm/pip dependencies without asking first.

## Auth

- Planned: OAuth-only (Google, GitHub) authorization code flow with signed state, JWT sessions -- port the ledger-sync design.
- Required env vars (names only): `ORBIT_GOOGLE_CLIENT_ID`, `ORBIT_GOOGLE_CLIENT_SECRET`, `ORBIT_GITHUB_CLIENT_ID`, `ORBIT_GITHUB_CLIENT_SECRET`, `ORBIT_JWT_SECRET_KEY`.
- Not yet implemented -- Sagar will supply OAuth app credentials when the auth milestone starts.

## API routes

- `GET /api/health` -- liveness + version
- See OpenAPI at `/docs` when server is running.

## DB schema

- Migrations in `backend/alembic/` (not yet initialized). Apply with `uv run alembic upgrade head`.
- Planned core tables: contacts, interactions, tags/circles, reminders.
