# Phase 5 — COMPLETE (i18n + SEO)

**Marked:** 2026-09-16

## Delivered

- `@varka/i18n` post/page/home paths + parsePathname + tests
- Punjabi: one language row (`pa`) + `script` field; URL `/pa/post/{slug}`
- `@varka/seo` buildSeo (titleTemplate), sitemap, robots + tests
- Astro `/sitemap.xml`, `/robots.txt`, BaseLayout SEO tags
- Admin SEO settings (AuthZ) + robotsIndex
- Admin Languages list/toggle + add Punjabi
- Seed: en + pa + default SEO settings

## Operator

```bash
pnpm db:seed   # en + pa languages
pnpm --filter @varka/web dev
# PUBLIC_SITE_URL=https://example.com
# PUBLIC_API_URL=http://localhost:3000
```
