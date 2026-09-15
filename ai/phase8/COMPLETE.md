# Phase 8 — COMPLETE (Security Hardening)

**Marked:** 2026-09-16

## Delivered

- AuditLog model + writeAudit / listAudit
- `@varka/security` headers, origin assert, tests
- Admin `proxy.ts` uses shared `securityHeaders()` + HSTS
- Public comments: origin + rate limit + audit
- Comment moderate audit
- Theme activate + SEO update audit
- Login rate-check API + audit on limit
- System audit UI (actor column, refresh)
- GET /api/audit (audit.read AuthZ)

```bash
pnpm --filter @varka/security test
curl -s http://localhost:3000/api/health
# Admin → System → audit log
```
