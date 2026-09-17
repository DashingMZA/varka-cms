# Security Hardening Checklist

Treat every item as required for admin mutations and auth surfaces.

## Authentication

- Session cookies: `httpOnly`, `Secure` in production, `SameSite=Lax` (or Strict where viable)
- Password hashing: Argon2id preferred; scrypt/bcrypt fallbacks only if documented
- Password policy: minimum length + complexity checks server-side
- Login rate-limit + failed-attempt audit log
- CSRF: same-origin checks on cookie sessions; CSRF token for form posts if needed

## Authorization

- Every mutating route calls `requirePermission` / role checks — never trust client role claims
- Disable inactive users; revoke sessions on password change / disable
- Never allow deleting the last Owner

## Input & output

- Validate all inputs with Zod on the server
- Sanitize HTML content (posts/comments) before store/render; CSP on admin responses
- Media: magic-byte MIME sniff, size limits, images-only when required

## Headers

- Security headers package (`packages/security`): CSP, X-Frame-Options, nosniff, Referrer-Policy
- Prefer nonces for any inline scripts if introduced

## Audit

- Write audit rows for login failures, role changes, destructive deletes, settings changes
- Admin System screen can list recent audit events for owners

## Secrets

- `AUTH_SECRET` ≥ 32 chars in production
- No secrets in client bundles; `.env.example` documents required vars without values
