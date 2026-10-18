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

Deploy: frontend live on GitHub Pages (`sagargupta.online/orbit/`); backend on Vercel serverless (`backend/vercel.json` + Mangum in `backend/api/index.py`, but no Vercel project exists yet); Neon PostgreSQL project `orbit` (Singapore, `aws-ap-southeast-1`) with migrations applied.

## Stack

- **Language**: Python 3.13 (backend), TypeScript (frontend)
- **Framework**: FastAPI + SQLAlchemy 2 + Alembic / React 19 + Vite + Tailwind CSS 4
- **Database**: SQLite dev (`./orbit.db`), Neon PostgreSQL prod
- **Package manager**: uv (backend), pnpm (frontend + root)
- **Deploy target**: GitHub Pages (wired, `deploy-frontend.yml`) + Vercel (config in repo, project not created)

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
- `frontend/src/App.tsx` -- routes: `/auth/callback/:provider`, everything else behind `ProtectedRoute`

## Key files

- `backend/src/orbit/config/settings.py` -- pydantic BaseSettings, all env vars prefixed `ORBIT_`
- `frontend/vite.config.ts` -- `@/` alias, `/api` proxy, GH Pages base path via `GITHUB_PAGES=true`
- `frontend/src/lib/auth/client.ts` -- axios client, Bearer header, single-flight 401 refresh
- `frontend/src/lib/config.ts` -- `VITE_API_BASE_URL` (empty in dev so `/api` hits the Vite proxy; the Pages build reads the repo variable)
- `frontend/DESIGN.md` -- visual spec and design tokens

## Gotchas

- Frontend package deps live in `frontend/package.json`; root `package.json` only has `concurrently`. Run installs in the right directory.
- `GITHUB_PAGES=true` flips Vite `base` to `/orbit/` -- production links break if forgotten in the deploy workflow.
- mypy runs in strict mode from `pyproject.toml` (`uv run mypy`, no path args needed).
- Mangum runs with `lifespan="off"` on Vercel, so `app.state.http_client` is never created there; `api/deps.py:get_http_client` builds it lazily. Keep that fallback.
- Without the `VITE_API_BASE_URL` repo variable the Pages build calls `sagargupta.online/api/...`, which 404s, and the sign-in screen shows "Could not reach the server".

## Repo-specific rules

- Follow ledger-sync patterns for anything not specified here: routers in `api/`, business logic in `core/`, schemas in `schemas/`, user-scoped queries, database-agnostic SQL, PageContainer/DataTable-style shared UI primitives once they exist.
- Mobile-first: tables must degrade to stacked cards on phones (most users are on phones).
- No new npm/pip dependencies without asking first.

## Auth

- OAuth-only (GitHub, Google) authorization code flow ported from ledger-sync: stateless HMAC-signed `state` from `/api/auth/oauth/providers`, which the callback page also checks against the copy it stored in sessionStorage; JWT access (30 min) and refresh (7 days) tokens carrying `tv` = `User.token_version`, bumped on logout and account delete.
- Backend env vars (names only): `ORBIT_ENVIRONMENT`, `ORBIT_DATABASE_URL`, `ORBIT_JWT_SECRET_KEY`, `ORBIT_FRONTEND_URL`, `ORBIT_CORS_ORIGINS`, `ORBIT_GITHUB_CLIENT_ID`, `ORBIT_GITHUB_CLIENT_SECRET`, `ORBIT_GOOGLE_CLIENT_ID`, `ORBIT_GOOGLE_CLIENT_SECRET`. Dev auto-generates a JWT secret when unset; any other environment refuses to start without one.
- Frontend build variable: `VITE_API_BASE_URL` (GitHub repo variable, read by `deploy-frontend.yml`).
- GitHub OAuth app callback URL: `https://sagargupta.online/orbit/auth/callback/github`. Not created yet.

## API routes

- `GET /api/health` -- liveness + version
- `GET /api/auth/oauth/providers`, `POST /api/auth/oauth/{github,google}/callback`
- `POST /api/auth/refresh`, `GET|PUT /api/auth/me`, `POST /api/auth/logout`, `DELETE /api/auth/account`
- `GET|POST /api/contacts`, `PATCH|DELETE /api/contacts/{id}` -- all scoped to the current user
- See OpenAPI at `/docs` when server is running.

## DB schema

- Migrations in `backend/src/orbit/db/migrations/` (`alembic.ini` in `backend/`). Apply with `uv run alembic upgrade head`; it reads `ORBIT_DATABASE_URL`.
- Every generated revision is run through `ruff check --fix` and `ruff format` by Alembic post-write hooks, so it passes CI unedited.
- Tables: `users` (OAuth identity, `token_version`), `contacts` (`user_id` FK, cascade delete). Planned next: interactions, tags/circles, reminders.
