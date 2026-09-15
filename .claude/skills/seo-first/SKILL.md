---
name: seo-first
description: Canonical, hreflang, JSON-LD, sitemap, robots, 404 status, URL safety. Use on every public route.
---

# SEO first

- One canonical per document
- hreflang from published translations; x-default = default language
- JSON-LD: Article / WebSite / Organization / Breadcrumb / Person as fits
- Sitemap excludes draft/trash/private/noindex/disabled langs
- robots: confirm if blocking `/`
- 404 HTTP status
- No IDs in public slugs; reserved paths: `/admin`, `/api`, `/search`, `/sitemap.xml`, `/robots.txt`, `/rss.xml`
- Theme change does not rewrite SEO rows
