# Changelog -- orbit

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

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
