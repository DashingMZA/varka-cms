# Phase 5: SEO + i18n routes

## Delivered

- `@varka/i18n` — postPath/pagePath/homePath/parsePathname (en → `/post/{slug}`, pa → `/pa/post/{slug}`)
- `@varka/seo` — buildSeo (canonical, OG, Twitter, JSON-LD), sitemap.xml, robots.txt
- Astro: SEO head in BaseLayout, `/sitemap.xml`, `/robots.txt`, `/pa/post/[slug]` shell
- Admin: `/seo` defaults + `GET/POST /api/seo`

## Local

```bash
pnpm --filter @varka/i18n test
pnpm --filter @varka/seo test
pnpm --filter @varka/web dev
# open /sitemap.xml /robots.txt /post/hello-world /pa/post/hello-world
```
