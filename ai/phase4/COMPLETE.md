# Phase 4 — COMPLETE (Themes + Public Astro)

**Marked:** 2026-09-15

## Delivered

- `@varka/themes` contract + 10 themes + lazy CSS (`getThemeCss`)
- Admin Appearance / theme activate API (AuthZ)
- Astro public site: home, `/post/[slug]`, 404
- Theme CSS injected via `activeThemeWithCss()` (fixes empty CSS / undefined name)
- Comments moderation APIs use real `getAuthContext` (related hardening)

## Local

```bash
pnpm --filter @varka/web dev     # :4321
# PUBLIC_API_URL=http://localhost:3000
# PUBLIC_THEME_ID=theme-01
pnpm --filter @varka/admin dev  # Appearance + Comments
```
