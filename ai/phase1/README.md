# Phase 1: Auth, Users, RBAC, Admin Shell

**Status:** `done` (source)  
**Depends on:** phase 0  
**Goal:** Real login, server-enforced RBAC, protected admin chrome.

## Delivered

- Better Auth (email/password + Google/GitHub env-gated)
- RBAC catalog + `requirePermission` + seed roles
- Users list / disable / revoke sessions (service + API)
- Admin shell + nav + dashboard gate
- `getAuthContext()` for API routes
- Dashboard layout redirects to `/login` when no session (prod)

## Operator

```bash
pnpm install
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm --filter @varka/admin dev
```

Login with `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` from `.env`.

Production: set `ALLOW_DEV_AUTH_FALLBACK=false` after login works.
