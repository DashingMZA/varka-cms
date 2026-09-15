# Phase 6: Native Comments + Moderation

## Delivered

- Comment services in `@varka/content` (submit, list, moderate, counts)
- Spam heuristics → status SPAM; else PENDING
- Admin `/comments` moderation UI
- Staff API: `GET/POST /api/comments`, `PATCH/DELETE /api/comments/[id]`
- Public API: `GET/POST /api/public/comments` (no auth; rate-limit later)

## Local

```bash
pnpm --filter @varka/content test
pnpm --filter @varka/admin dev
# /comments
# POST /api/public/comments { postId, authorName, body }
```
