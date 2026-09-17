# Security Hardening Checklist

Treat every item here as required, not optional — apply to every mutation before
considering a feature "done".

## Authentication
- Session-based auth (Auth.js/NextAuth or a custom implementation) using **httpOnly,
  Secure, SameSite=Lax/Strict** cookies — never store session tokens in localStorage.
- Passwords hashed with bcrypt or argon2 (never MD5/SHA1/plaintext); enforce a minimum
  strength policy with a visible strength meter on set/change.
- Account lockout / exponential backoff after repeated failed logins per
  account+IP; generic "invalid credentials" error (don't reveal whether the email exists).
- Optional-but-recommended TOTP two-factor authentication, enforceable per-role (e.g.
  required for Administrators).
- Password reset via time-limited, single-use signed tokens emailed to the account address
  — never return the new password or token in an API response.

## Authorization (RBAC)
- Central capability-check middleware/helper (`can(user, 'edit_others_posts')`) called at
  the top of **every** Server Action / Route Handler that mutates or reads privileged data
  — the sidebar hiding a menu item is a UX courtesy only, never the actual gate.
- Default-deny: unknown/unmapped actions require explicit capability grant, not implicit
  allow.
- Object-level checks, not just action-level — e.g. an Author can `edit_post` only when
  they own that specific post, verified server-side against the resource's `authorId`.

## CSRF & request integrity
- CSRF token (double-submit cookie or framework-provided) required on all state-changing
  requests, equivalent to WP's `wp_nonce`; reject requests with a missing/mismatched token.
- `SameSite` cookies as the first line of defense, CSRF tokens as the second.

## Input validation & output safety
- Schema-validate every input server-side (e.g. zod) — never trust client-side validation
  alone.
- Sanitize any HTML the app stores/renders from rich-text input (DOMPurify or equivalent)
  to block stored XSS; escape all dynamic output in templates by default (React does this
  for you — never use `dangerouslySetInnerHTML` on unsanitized content).
- Use parameterized queries / an ORM (Prisma) exclusively — no raw string-concatenated SQL.

## File uploads
- Whitelist MIME types **and** file extensions (check both — don't trust the
  `Content-Type` header alone; sniff actual file bytes).
- Enforce max file size and, for images, max dimensions; re-encode/re-process images
  server-side rather than serving the raw uploaded bytes.
- Reject executable/script-like extensions outright (`.php`, `.phtml`, `.js`, `.exe`,
  `.sh`, etc.) regardless of declared MIME type — mirrors WP's own upload blocklist.
- Store uploads in object storage (S3-class) outside the app's executable path, serve via
  CDN/signed URLs; randomize stored filenames to avoid collisions/overwrites and to avoid
  leaking the original filename if that matters for privacy.

## API tokens / application passwords
- Per-user scoped personal access tokens for third-party/API integrations, hashed at rest,
  individually revocable, with last-used timestamps shown to the user.

## Session management
- Idle session timeout + absolute max session lifetime.
- "Log out of all other sessions" action; a visible list of active sessions
  (device/IP/last-seen) on the user's profile.

## Rate limiting
- Apply per-IP/per-account rate limits to: login, password reset request, comment
  submission, and any public-facing write endpoint — return 429 with a retry-after hint.

## Security headers
- `Content-Security-Policy` (restrict script/style/img sources), `X-Frame-Options: DENY`
  or `frame-ancestors 'none'` on admin routes (prevents clickjacking on the admin panel),
  `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy:
  strict-origin-when-cross-origin`.

## Audit log
- Append-only log of sensitive actions: login/logout (+ failed attempts), content
  publish/edit/delete, role/permission changes, settings changes, user create/delete,
  API-token create/revoke — record actor, action, target, timestamp, IP/user-agent.
  Viewable (read-only) by Administrators under Tools → Audit Log, exportable as CSV.

## Site-Health-style diagnostics (surfaced on the dashboard)
Automated checks, each Good/Warning/Critical: HTTPS enforced, dependency versions
up to date, DB connectivity, background job/cron health, disk/storage usage, backups
configured & recent, error-rate spike detection, outdated/unused API tokens.

## Backups
- Scheduled automated DB + media backups with a retention policy; one-click restore-point
  listing; manual "Export site content" (JSON) and "Import" tools mirroring WP's
  export/import, so content is portable and not locked in.

## Privacy / compliance
- Honor the Settings → Privacy export/erase-request queue (see `settings-pages.md`) —
  don't build a "delete account" button that silently skips the audit/export step.
