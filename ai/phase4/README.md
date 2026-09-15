# Phase 4: Themes + Public Astro

**Status:** source complete  

## Delivered

- `@varka/themes` contract + registry
- **theme-01** Clean Editorial, **theme-02** Dark Editorial
- Admin Appearance: list + activate → `SiteSetting theme.active`
- `apps/web` Astro 7 static site: home, `/post/[slug]`, 404, theme CSS injection
- URL lock: default language posts at `/post/{slug}`

## Local

```bash
pnpm --filter @varka/themes test
pnpm --filter @varka/web dev     # :4321
pnpm --filter @varka/admin dev  # :3000/appearance
```
