# Changelog -- orbit

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## 0.2.1 - 2026-10-21

The README opens with an architecture diagram.

### Added

- [docs/diagrams/architecture.yaml](docs/diagrams/architecture.yaml): the production shape drawn with orrery. The web app on GitHub Pages calls the API on Vercel sin1, which uses Neon PostgreSQL; sign-in goes through GitHub OAuth; GitHub Actions deploys the web app and runs Alembic migrations on main. Every node and edge carries `evidence:` pointing at the file and line it comes from. Rendered to `architecture-dark.svg` and `architecture-light.svg`, which the README shows by the reader's color scheme.

## 0.2.0 - 2026-10-18

orbit becomes a working personal CRM. The four "coming soon" pages are real, and contacts can be managed end to end.

### Added

- Contacts: add and edit in a dialog (phone, company, title, birthday, notes, keep-in-touch cadence), delete one, delete selected, and remove all sample data in one step. Search, circle and status filters, and a detail page with the person's interactions and reminders.
- Interactions: log a call, email, message, meeting or other note against a contact, edit or delete it, and browse a day-grouped feed. Each change recomputes the contact's last contacted time.
- Keep in touch: a cadence in days per contact, and a due date the dashboard and Reminders page surface.
- Reminders: open, done and all views, grouped into overdue, today, this week and later, optionally linked to a contact.
- Circles: members per circle, who is due, and moving a person to another circle.
- Dashboard: totals, who to reach out to, upcoming reminders and birthdays, recent activity and circle sizes. A first-run screen offers to add a contact or load sample data.
- Sample data from the server (`POST /api/samples`, `DELETE /api/samples`). It creates contacts, interactions and reminders flagged as samples, so removing them never touches real rows.
- Real URLs for every page (`/contacts/:id` can be bookmarked), a phone top bar with theme toggle and sign out, toasts, confirm dialogs and bottom-sheet dialogs.
- [docs/ROADMAP.md](docs/ROADMAP.md): a sourced survey of personal CRMs and the next ten features.
- CI migrates a scratch database and runs `alembic check` on every PR. After all checks pass on `main`, a migrate job applies pending migrations to Neon.

### Changed

- Migration `52362808c598` adds the new contact columns and the `interactions` and `reminders` tables. It marks the 12 contacts the old seed button created as samples and drops the free-text `last_interaction` column, which `last_contacted_at` replaces.

## 0.1.2 - 2026-10-18

The backend is ready to import into Vercel, matching ledger-sync's working setup.

### Changed

- `backend/api/index.py` exports the FastAPI ASGI `app`, which Vercel's Python runtime serves directly. The Mangum wrapper and its dependency are removed.
- New `backend/requirements.txt` for the Vercel build: pinned runtime dependencies from `uv export`, plus a `.` line that installs the `src/orbit` package itself. Checked by installing it into a clean venv, importing the entry file, and getting `/api/health` 200; the production guard still refuses to start without `ORBIT_JWT_SECRET_KEY`.

## 0.1.1 - 2026-10-18

A security and repo-health pass: a sign-in fix, four dependency and workflow alerts closed, and CI moved off deprecated actions.

### Security

- The OAuth callback page now rejects a callback whose `state` does not match the one this browser stored when sign-in started. The backend's HMAC check proves the server issued a state, not that this tab began the flow, so a forged callback link could previously sign a visitor into someone else's account.
- Transitive shell-quote moves from 1.10.0 to 1.12.0 through the root `pnpm-workspace.yaml` override (Dependabot alert #32, critical). Dev tooling only, pulled in by `concurrently`.
- Transitive source-map-js moves from 1.2.1 to 1.2.2 in the frontend lockfile (CVE-2026-93749). Build tooling only; nothing shipped to the browser changes.
- Transitive Mako moves from 1.3.12 to 1.4.3 in the backend lockfile (CVE-2026-102991). Alembic uses it only when generating migrations.
- The CI workflow's token is limited to `contents: read`; the security job keeps its own `security-events: write` (CodeQL `actions/missing-workflow-permissions`, two alerts).

### Changed

- GitHub Actions pinned to the latest Node 24 releases: checkout 7.0.1, setup-uv 10.3.0, pnpm/action-setup 6.1.0, setup-node 7.1.0, cache 6.1.0, upload-pages-artifact 5.0.0, deploy-pages 5.0.1. Clears the Node 20 deprecation warnings on the Pages deploy.
- Alembic runs `ruff check --fix` and `ruff format` on every generated revision, so a new migration passes CI's ruff gates as written.
- Vendor skill installs (`.claude/skills/`, `skills-lock.json`) are gitignored.

## 0.1.0 - 2026-10-10

First working version.

### Added

- Contacts dashboard: sortable, searchable table that turns into stacked cards on phones, sidebar and bottom tab bar, light and dark themes on a Tailwind 4 token system.
- OAuth-only sign-in (GitHub and Google) with signed stateless `state`, JWT access and refresh tokens, and a `token_version` claim so logout revokes every session.
- User-scoped contacts API (`/api/contacts` list, create, update, delete) on SQLAlchemy 2, with Alembic migrations applied to Neon PostgreSQL.
- Frontend deploy to GitHub Pages on every push to `main`.
