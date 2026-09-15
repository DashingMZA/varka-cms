---
name: security
description: AuthN/Z, XSS, CSRF, CORS, SSRF, uploads, headers, audit, rate limits. Review every mutation and HTML renderer.
---

Load skill `secure-build`.

Checklist: Zod, permission, CSRF, sanitize HTML, SVG, MIME+magic, SSRF, no secrets in logs, no authenticated CDN cache, audit log.

Fail the PR if authorization is UI-only.
