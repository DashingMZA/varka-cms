---
name: secure-build
description: Apply security blocks (validation, XSS, CSRF, CORS, SSRF, hashing, authz, brute force, rate limit, uploads) to the current slice.
---

# Secure build

From Vibe Blocks 21–30, 38.

For **every** new endpoint or HTML renderer:

- [ ] Zod schema at the door
- [ ] `requirePermission` server-side
- [ ] CSRF if cookie mutation
- [ ] Sanitize any HTML (Tiptap, comments, custom)
- [ ] Uploads: MIME, magic bytes, size, SVG sanitize
- [ ] User URLs: SSRF allowlist / private-IP block + DNS recheck
- [ ] Rate limit auth, search, comments, upload
- [ ] No secrets in logs or client bundles
- [ ] Audit log on admin mutations

Fail closed.
