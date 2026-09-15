# Phase 9: Performance + Live Public Content

## Delivered

- Public posts API: `GET /api/public/posts`, `GET /api/public/posts/[slug]`
- Cached reads (60–120s TTL) via `@varka/cache`
- Cache invalidation on post update/publish
- CDN-friendly `Cache-Control` / `s-maxage` / `stale-while-revalidate`
- Astro home + `/post/[slug]` fetch live published posts
- Sitemap built from published posts API

## Local

```bash
# terminal 1
pnpm --filter @varka/admin dev
# terminal 2
PUBLIC_API_URL=http://localhost:3000 pnpm --filter @varka/web dev
# Publish a post in admin → refresh Astro home
```
