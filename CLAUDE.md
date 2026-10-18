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

Deploy: frontend live on GitHub Pages (`sagargupta.online/orbit/`); backend on Vercel serverless (`backend/vercel.json`, `backend/api/index.py` exports the ASGI `app`, deps from `backend/requirements.txt`; Vercel project `orbit-api` in team `sagargupta16s-projects`, git-linked to `main`, live at `https://orbit-api-eight.vercel.app`); Neon PostgreSQL project `orbit` (Singapore, `aws-ap-southeast-1`) with migrations applied.

## Stack

- **Language**: Python 3.13 (backend), TypeScript (frontend)
- **Framework**: FastAPI + SQLAlchemy 2 + Alembic / React 19 + Vite + Tailwind CSS 4
- **Database**: SQLite dev (`./orbit.db`), Neon PostgreSQL prod
- **Package manager**: uv (backend), pnpm (frontend + root)
- **Deploy target**: GitHub Pages (wired, `deploy-frontend.yml`) + Vercel (`orbit-api`, redeploys on every push to `main` that touches `backend/`)

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
- `frontend/src/App.tsx` -- routes: `/`, `/contacts`, `/contacts/:id`, `/interactions`, `/circles`, `/reminders` behind `ProtectedRoute`, plus `/auth/callback/:provider`
- `frontend/src/lib/api/` -- typed clients per resource; `frontend/src/components/ui/` -- Button, Modal (bottom sheet on phones), ConfirmDialog, Toast, Field, EmptyState, PageSection, DataTable

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
- A serverless runtime may skip the FastAPI lifespan, so `app.state.http_client` can be missing; `api/deps.py:get_http_client` builds it lazily. Keep that fallback.
- Vercel installs from `backend/requirements.txt` (its first line `.` installs the `src/orbit` package). Regenerate it with `uv export --no-dev --no-hashes --no-emit-project --no-annotate` whenever runtime deps change, and keep the header and the `.` line.
- Without the `VITE_API_BASE_URL` repo variable the Pages build calls `sagargupta.online/api/...`, which 404s, and the sign-in screen shows "Could not reach the server".

## Repo-specific rules

- Follow ledger-sync patterns for anything not specified here: routers in `api/`, business logic in `core/`, schemas in `schemas/`, user-scoped queries, database-agnostic SQL, PageContainer/DataTable-style shared UI primitives once they exist.
- Mobile-first: tables must degrade to stacked cards on phones (most users are on phones).
- No new npm/pip dependencies without asking first.

## Auth

- OAuth-only (GitHub, Google) authorization code flow ported from ledger-sync: stateless HMAC-signed `state` from `/api/auth/oauth/providers`, which the callback page also checks against the copy it stored in sessionStorage; JWT access (30 min) and refresh (7 days) tokens carrying `tv` = `User.token_version`, bumped on logout and account delete.
- Backend env vars (names only): `ORBIT_ENVIRONMENT`, `ORBIT_DATABASE_URL`, `ORBIT_JWT_SECRET_KEY`, `ORBIT_FRONTEND_URL`, `ORBIT_CORS_ORIGINS`, `ORBIT_GITHUB_CLIENT_ID`, `ORBIT_GITHUB_CLIENT_SECRET`, `ORBIT_GOOGLE_CLIENT_ID`, `ORBIT_GOOGLE_CLIENT_SECRET`. Dev auto-generates a JWT secret when unset; any other environment refuses to start without one.
- Set on Vercel: `ORBIT_ENVIRONMENT`, `ORBIT_FRONTEND_URL` (plain); `ORBIT_DATABASE_URL` (Neon pooled), `ORBIT_JWT_SECRET_KEY`, `ORBIT_GITHUB_CLIENT_ID`, `ORBIT_GITHUB_CLIENT_SECRET` (sensitive, unreadable after creation). Env changes only apply after a redeploy.
- Frontend build variable: `VITE_API_BASE_URL` = `https://orbit-api-eight.vercel.app` (GitHub repo variable, read by `deploy-frontend.yml`).
- GitHub OAuth app `orbit` (github.com/settings/developers), redirect URI `https://sagargupta.online/orbit/auth/callback/github`. Google sign-in is not configured yet.

## API routes

- `GET /api/health` -- liveness + version
- `GET /api/auth/oauth/providers`, `POST /api/auth/oauth/{github,google}/callback`
- `POST /api/auth/refresh`, `GET|PUT /api/auth/me`, `POST /api/auth/logout`, `DELETE /api/auth/account`
- `GET|POST /api/contacts` (`?q=` matches name, email, company and notes; `?circle=`, `?status=`), `GET|PATCH|DELETE /api/contacts/{id}`, `POST /api/contacts/bulk-delete`
- `GET|POST /api/interactions` (`?contact_id=`, `?limit=` up to 200, `?before=` cursor), `PATCH|DELETE /api/interactions/{id}`. Every write recomputes the contact's `last_contacted_at`.
- `GET|POST /api/reminders` (`?status=open|done|all`, `?contact_id=`), `PATCH|DELETE /api/reminders/{id}`
- `GET /api/dashboard?today=YYYY-MM-DD` -- totals, circles, recent activity, upcoming reminders, reconnects, birthdays
- `POST /api/samples?today=` (409 when samples exist), `DELETE /api/samples` -- sample rows are flagged `is_sample`, so removing them never touches real data
- Everything except health and OAuth is scoped to the current user; another user's row is a 404. See OpenAPI at `/docs` when the server is running.

## DB schema

- Migrations in `backend/src/orbit/db/migrations/` (`alembic.ini` in `backend/`). Apply with `uv run alembic upgrade head`; it reads `ORBIT_DATABASE_URL`.
- Every generated revision is run through `ruff check --fix` and `ruff format` by Alembic post-write hooks, so it passes CI unedited.
- Tables: `users` (OAuth identity, `token_version`); `contacts` (profile fields, `stay_in_touch_days` cadence, `last_contacted_at`, `is_sample`); `interactions` and `reminders` (both `user_id` and `contact_id` FKs with ON DELETE CASCADE). Circles are a fixed enum on `contacts.circle`.
- CI migrates a scratch SQLite and runs `alembic check` (models and migrations must agree). On `main`, the `migrate` job in `ci.yml` (calling `migrate.yml`, environment `production`) applies migrations to Neon after every check passes, using the `ORBIT_DATABASE_URL` repo secret (Neon's direct, non-pooled URL).
- Next features, ranked with sources: [docs/ROADMAP.md](docs/ROADMAP.md).
