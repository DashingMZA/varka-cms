# Phase 2 — COMPLETE (source)

**Marked:** 2026-09-15

## Delivered

- Post / PostTranslation CRUD + publish + trash + revisions
- Optimistic concurrency (`version`)
- HTML sanitization on save
- Pages list/create service + `/api/pages`
- Categories / tags list/create + APIs
- Public published posts API (cached)
- Admin list + editor UI
- AuthZ on post routes via `getAuthContext`

## Operator

```bash
pnpm db:migrate
pnpm --filter @varka/admin dev
# Content → create post → edit → publish
# Public: GET /api/public/posts
```
