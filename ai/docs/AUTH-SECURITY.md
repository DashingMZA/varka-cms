# Auth & anti-tamper security (VARKA)

**Updated:** 2026-09-18

> No system is “unhackable.” Goal = **defense in depth** so password theft, session theft, CSRF, and brute-force are expensive and detectable.

## Password storage

| Control | Implementation |
|---------|----------------|
| Algorithm | **Argon2id** via `@node-rs/argon2` (OWASP preferred) |
| Fallback | scrypt `N=2^17,r=8,p=1` if native Argon2 missing |
| Policy | min **12**, max **128** chars |
| Salt | per-password (library/PHC) |
| Compare | timing-safe where applicable |

Env: `AUTH_ARGON2_MEMORY_KIB`, `AUTH_ARGON2_TIME_COST`, `AUTH_ARGON2_PARALLELISM`

## Secrets

| Control | Rule |
|---------|------|
| `AUTH_SECRET` | ≥32 random chars; **required** in production |
| Placeholder detection | `change-me` / `dev-only` refused in production |
| OAuth secrets | env only; never commit |

```bash
openssl rand -base64 48
```

## Sessions (anti-tamper)

| Control | Setting |
|---------|---------|
| Cookie | `httpOnly`, `secure` (prod), `sameSite=lax`, prefix `varka` |
| Lifetime | 7 days; refresh window 24h |
| Cookie cache | 5 min (perf; server session still authoritative) |
| Revoke | `revokeAllSessions` for admin disable / compromise |

## Request integrity

| Control | Where |
|---------|--------|
| Trusted origins | `ADMIN_URL`, `SITE_URL`, `BETTER_AUTH_URL` |
| Same-origin asserts | `@varka/security` origin helpers |
| Security headers | CSP, `X-Frame-Options`, `nosniff`, HSTS (HTTPS) |
| Rate limit / lockout | `@varka/auth` rate-limit (5 fails → 15 min) |

## AuthZ

- Permissions from DB (`loadAuthContext`)
- `requirePermission` on mutating APIs
- Disabled users rejected in `loadAuthContext`

## Operator checklist

1. Set strong `AUTH_SECRET` in production
2. HTTPS only for admin
3. Keep `trustedOrigins` tight
4. Enable email verification when mail works
5. Redis rate-limit in multi-instance
6. Audit log on auth events

Files: `packages/auth/src/password.ts`, `packages/auth/src/server.ts`
