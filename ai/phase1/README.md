# Phase 1: Auth, Users, RBAC, Admin Shell

**Status:** `partial` (see `ai/memory/STATUS.md`)  
**Depends on:** phase 0  
**Goal:** Real login, server-enforced RBAC, protected admin chrome.

## Modules

- **auth** — Better Auth email/password + Google/GitHub; sessions; rate limit hooks
- **users** — User list/create/disable (admin)
- **rbac** — Roles, permissions, `requirePermission()`
- **admin-shell** — Next.js 16 App Router layout + nav

## Gaps (active)

- [ ] Replace `dev-user` API context with session from Better Auth
- [ ] Enforce auth on all `/api/*` except health + public + auth
- [ ] Login → dashboard redirect verified on Vercel
- [ ] Seed owner user with password flow documented

## Local run

```bash
corepack enable && corepack prepare pnpm@11.27.0 --activate
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm --filter @varka/admin dev
```

Admin: http://localhost:3000
