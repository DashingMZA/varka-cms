# Task memory index

Newest first. Read this before starting related work so decisions stay consistent.

| Date | Task | Summary |
|------|------|--------|
| 2026-10-04 | [admin-build-fix](./admin-build-fix.md) | Fixed 51 pre-existing TS errors blocking `@varka/admin` build (auth/i18n/content/admin type fixes, ActionResult dedup, zod direct dep); build + typecheck PASS, lint down to 2 pre-existing eqeqeq |
| 2026-10-04 | [celebrtiy-web-templates](./celebrtiy-web-templates.md) | Celebrtiy theme-11 Astro templates: `src/celebrtiy/` data layer, 14 components, CelebrtiyLayout, routes (home/post/page/category/tag/author/search/404) branching on active theme; fixed pre-existing `@varka/content` bad re-exports; web build PASS |
| 2026-10-04 | [theme-11-celebrtiy](./theme-11-celebrtiy.md) | New theme-11 "Celebrtiy Kadence" in `@varka/themes`: manifest + full celebrtiy.com CSS (Kadence palette, Overpass), registry/index/test wired; tests 5/5, typecheck clean |
| 2026-10-04 | [celebrtiy-wp-import](./celebrtiy-wp-import.md) | Idempotent WP REST → VARKA import script `scripts/wp-import-celebrtiy/` (posts/pages/categories/tags/media, local media download + URL rewrite, sets `theme.active=theme-11`); typechecked, not run (no DB in env) |
| 2026-09-18 | [admin-dashboard-wp-parity-audit](./admin-dashboard-wp-parity-audit.md) | WP admin parity audit; Privacy/Categories/Tags/Appearance IA; shared list-table |
| 2026-09-18 | [setup-wp-admin-skill-and-memory](./setup-wp-admin-skill-and-memory.md) | Installed wp-admin-dashboard skill; CLAUDE.md / AGENTS.md; task memory folder |
| 2026-10-05 | [plugin-system-wordpress-import](./plugin-system-wordpress-import.md) | WordPress-style plugin system: `@varka/plugins` package (manifest schema, ZIP installer, registry), Plugin model + migration, admin Plugins page (ZIP upload/activate/delete), dynamic plugin pages at /plugins/[slug], plugin API dispatch, bundled wordpress-import v1.0.0 plugin (WP REST import via admin UI); pushed as 6ab7e78 |
