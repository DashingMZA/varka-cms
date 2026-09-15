# Phase 1: Auth, Users, RBAC, Admin Shell

**Status:** `in-progress`  
**Depends on:** phase 0 (source complete; local install required)  
**Goal:** Real login, server-enforced RBAC, protected admin chrome.

## Modules

- **auth** — Better Auth email/password + Google/GitHub; sessions; rate limit hooks
- **users** — User list/create/disable (admin)
- **rbac** — Roles, permissions, `requirePermission()`
- **admin-shell** — Next.js 16 App Router layout + nav

## Local run (after extract)

```bash
corepack enable && corepack prepare pnpm@11.27.0 --activate
cp .env.example .env   # set DATABASE_URL, AUTH_SECRET, SITE_URL, ADMIN_URL
pnpm install
pnpm db:generate
pnpm db:migrate        # needs Postgres
pnpm db:seed
pnpm --filter @varka/admin dev
```

Admin: http://localhost:3000
