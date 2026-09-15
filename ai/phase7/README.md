# Phase 7: Cache, Rate Limit, Queues

## Delivered

- `@varka/cache` — CacheStore interface, memory store, Redis store (optional `redis` package), rateLimit, CacheKeys
- `@varka/queue` — memory queue, job names, worker tick loop
- `workers/jobs` — background worker entry
- Public comments: **5 / 10 min / IP** rate limit (429 + Retry-After)
- `GET /api/health` — cache driver + ping

## Env

```
REDIS_URL=redis://localhost:6379   # optional; memory fallback if unset
```

## Local

```bash
pnpm --filter @varka/cache test
pnpm --filter @varka/queue test
pnpm --filter @varka/admin dev
curl http://localhost:3000/api/health
```
