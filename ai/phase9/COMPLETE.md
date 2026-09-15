# Phase 9 — COMPLETE (Performance + Live Public Content)

**Marked:** 2026-09-16

## Delivered

- Public posts API with cache + `s-maxage` / SWR
- Cache invalidation on post PATCH **and** trash/DELETE
- Astro **server** output (`@astrojs/node`) — live home + `/post/[slug]` without rebuild
- Page-level Cache-Control headers
- Dynamic sitemap + robots
- CORS on public posts GET for browser clients

## Local

```bash
pnpm install   # picks up @astrojs/node
# terminal 1
pnpm --filter @varka/admin dev
# terminal 2
PUBLIC_API_URL=http://localhost:3000 pnpm --filter @varka/web dev
# Publish post → refresh http://localhost:4321/
```
