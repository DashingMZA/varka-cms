# Settings pages

WordPress-style Settings menu with submenu pages. Each page is a form backed by
`SiteSetting` (or group JSON) — no source change for normal ops.

## Submenus

1. **General** — site title, tagline, admin email, timezone, date/time format, language
2. **Writing** — default post category, default format
3. **Reading** — homepage displays, posts per page, search engine visibility
4. **Discussion** — default comment status, moderation, avatars, disallowed keys
5. **Media** — image sizes (thumbnail/medium/large), organize uploads by date
6. **Permalinks** — structure presets + custom base

## UX

- Shared settings form component; save via PATCH `/api/settings?group=`
- Success notice after save; validate with Zod server-side

## VARKA

- Routes: `apps/admin/src/app/(dashboard)/settings/*`
- Component: `settings-form.tsx`
