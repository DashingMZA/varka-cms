# Phase 6 — COMPLETE (Native Comments)

**Marked:** 2026-09-16

## Delivered

- submit + sanitize + spam heuristics + honeypot
- parent validation (one-level replies)
- list approved + replies; moderate list/counts; set status/delete
- Admin `/comments` UI (AuthZ)
- Public `GET/POST /api/public/comments` + rate limit + CORS for SITE_URL
- Astro `CommentSection` on `/post/[slug]`
- Unit tests for spam + validation

## Env

```bash
SITE_URL=http://localhost:4321   # allowed origin for comment POST
ADMIN_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:3000
```
