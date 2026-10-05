# Task memory index

Newest first. Read this before starting related work so decisions stay consistent.

| Date | Task | Summary |
|------|------|--------|
| 2026-10-05 | [updates-page](./updates-page.md) | WordPress-style Updates page: /dashboard/updates checks npm registry for outdated @varka/* packages and deps, shows app version + git commit; Dashboard nav submenu (Home, Updates); i18n in 4 locales |
| 2026-10-05 | [i18n-locale-coverage-100](./i18n-locale-coverage-100.md) | 100% locale key coverage for nav/dashboard/blogs/comments/forms: 239 keys added to ar/es/ur (nav +68, dashboard +24, blogs +66, comments +54, forms +27); key-parity verified; pushed as 2eafa73 |
| 2026-10-05 | [i18n-batch-3-final](./i18n-batch-3-final.md) | i18n batch 3 FINAL: restored batch-1 stash (page-create/menu/page-editor/user-new), converted 10 components (audit-log, autosave, insert-image-modal, post-create, revision-history, roles-matrix, system-health, theme-picker, list-table, screen-meta) + 10 app pages to client components, deleted dead media-settings.tsx; new keys in 11 namespaces × 4 locales; tsc PASS; final audit = zero hardcoded strings; committed as 0b5f180 |
| 2026-10-05 | [i18n-batch-2-widgets-media-dashboard](./i18n-batch-2-widgets-media-dashboard.md) | i18n batch 2: widgets-admin fully converted (new `widgets` namespace, 12 keys × 4 locales), media-library SIZE_LABELS → i18n, dashboard ScreenMeta title/help → i18n; users/comments/menus verified already converted; typecheck PASS; pushed as 616e24f |
| 2026-10-05 | [vercel-plugin-files-fix](./vercel-plugin-files-fix.md) | Vercel function bundles were missing `apps/admin/plugins/` (file tracing skips them) → plugin "Files missing", WP Import page 404. Fixed with `outputFileTracingIncludes` in admin next.config; typecheck PASS; committed locally as 583d72c but GitHub push approval timed out — not yet on origin |
| 2026-10-05 | [plugin-zip-decompressed-cap](./plugin-zip-decompressed-cap.md) | Zip-bomb guard in `@varka/plugins` installer: 250 MB total + 50 MB/file decompressed caps (declared-size pre-check + inflated-buffer ground truth); typecheck + 3 functional ZIP tests PASS |
| 2026-10-04 | [admin-build-fix](./admin-build-fix.md) | Fixed 51 pre-existing TS errors blocking `@varka/admin` build (auth/i18n/content/admin type fixes, ActionResult dedup, zod direct dep); build + typecheck PASS, lint down to 2 pre-existing eqeqeq |
| 2026-10-04 | [celebrtiy-web-templates](./celebrtiy-web-templates.md) | Celebrtiy theme-11 Astro templates: `src/celebrtiy/` data layer, 14 components, CelebrtiyLayout, routes (home/post/page/category/tag/author/search/404) branching on active theme; fixed pre-existing `@varka/content` bad re-exports; web build PASS |
| 2026-10-04 | [theme-11-celebrtiy](./theme-11-celebrtiy.md) | New theme-11 "Celebrtiy Kadence" in `@varka/themes`: manifest + full celebrtiy.com CSS (Kadence palette, Overpass), registry/index/test wired; tests 5/5, typecheck clean |
| 2026-10-04 | [celebrtiy-wp-import](./celebrtiy-wp-import.md) | Idempotent WP REST → VARKA import script `scripts/wp-import-celebrtiy/` (posts/pages/categories/tags/media, local media download + URL rewrite, sets `theme.active=theme-11`); typechecked, not run (no DB in env) |
| 2026-09-18 | [admin-dashboard-wp-parity-audit](./admin-dashboard-wp-parity-audit.md) | WP admin parity audit; Privacy/Categories/Tags/Appearance IA; shared list-table |
| 2026-09-18 | [setup-wp-admin-skill-and-memory](./setup-wp-admin-skill-and-memory.md) | Installed wp-admin-dashboard skill; CLAUDE.md / AGENTS.md; task memory folder |
| 2026-10-05 | [plugin-system-wordpress-import](./plugin-system-wordpress-import.md) | WordPress-style plugin system: `@varka/plugins` package (manifest schema, ZIP installer, registry), Plugin model + migration, admin Plugins page (ZIP upload/activate/delete), dynamic plugin pages at /plugins/[slug], plugin API dispatch, bundled wordpress-import v1.0.0 plugin (WP REST import via admin UI); pushed as 6ab7e78 |

## Deployment fix (2026-10-05)
- Prisma schema fix: added `notFoundLogs NotFoundLog[]` to Site model (was breaking Vercel build)
- All 24 pending commits pushed to GitHub, Vercel deployment READY
- Full feature test passed: Updates, Tools (Import/Export/Scheduled), 404 monitor, Bulk Edit, Media
- User ran db:migrate, 404 monitor verified working
