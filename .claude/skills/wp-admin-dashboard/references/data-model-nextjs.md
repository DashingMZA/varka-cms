# Data Model & Architecture (Next.js)

## Apps

- `apps/admin` — Next.js 16 App Router: UI + Route Handlers
- `apps/web` — Astro 7 public site
- `packages/database` — Prisma schema + client
- `packages/auth`, `packages/permissions`, `packages/media`, `packages/content`, …

## Core Prisma entities (admin-relevant)

- **Site** — tenant root (`slug: varka` seed)
- **User** + **UserRole** + **Role** — auth and RBAC; `adminColorScheme` on User
- **Post** / **PostTranslation** — multilingual posts, status, version, featured image
- **Page** / **PageTranslation** — pages
- **Category** / **Tag** + join tables
- **Comment** — moderation statuses
- **MediaAsset** — storage key, derivatives JSON, alt/title/caption/keywords
- **Revision** — post/page history
- **AuditLog** — security/ops trail
- **SiteSetting** — grouped settings JSON/key-value

## Status enums

- Content: `DRAFT | PENDING_REVIEW | SCHEDULED | PUBLISHED | TRASHED`
- Comments: `PENDING | APPROVED | SPAM | TRASHED` (as implemented in schema)

## Patterns

- Prefer server Route Handlers under `apps/admin/src/app/api/*` with `getAuthContext`
- Optimistic concurrency via `version` on posts where implemented
- Public APIs under `/api/public/*` only expose published content

## Migrations

- Use Prisma migrate; never hand-edit production schema without migration
- Seed roles, default site, default language, owner user
