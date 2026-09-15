# Phase 8: Security Hardening

## Delivered

- `AuditLog` model
- `@varka/security` — headers, same-origin assert, audit write/list
- Admin middleware: CSP, nosniff, frame deny, referrer, Permissions-Policy, HSTS on HTTPS
- Public comment POST: origin check + audit
- Comment moderation: audit on status change
- Admin `/system` audit viewer + `GET /api/audit`

## Local

```bash
pnpm --filter @varka/security test
pnpm db:generate && prisma db push
pnpm --filter @varka/admin dev
# /system
```
