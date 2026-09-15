# Phase 1 — COMPLETE

**Marked:** 2026-09-15

## Delivered

- Better Auth + Prisma adapter (`secret`, `baseURL`, secure cookies in prod)
- Email/password + Google/GitHub (env-gated)
- Rate-limit + lockout on login (`/api/auth/rate-check` + LoginForm)
- RBAC seed + `requirePermission` + unit tests
- Users: list / create / disable / revoke sessions (API + page)
- Dashboard: live DB counts + session gate + sign-out
- Audit API uses real AuthZ

## Operator

```bash
corepack prepare pnpm@12.4.2 --activate
pnpm install
pnpm db:generate && pnpm db:migrate && pnpm db:seed
# Create password for SEED_OWNER_EMAIL via Better Auth sign-up or admin flow
pnpm --filter @varka/admin dev
```

Env: `AUTH_SECRET` (≥32), `ADMIN_URL`, `DATABASE_URL`, `ALLOW_DEV_AUTH_FALLBACK`.
