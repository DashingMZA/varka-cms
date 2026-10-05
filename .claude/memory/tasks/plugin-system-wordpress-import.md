# Plugin System + WordPress Import Plugin

**Date:** 2026-10-05
**Commit:** 6ab7e78 (pushed to main via GitHub MCP push_files)

## What was built

### 1. `@varka/plugins` package (new)
WordPress-style plugin infrastructure:
- `src/manifest.ts` — zod schema for `plugin.json` (slug, name, version, description,
  author, license, varka constraint, autoActivate, admin.menuTitle/menuIcon/entry)
- `src/paths.ts` — plugin dir resolution (`process.cwd()/plugins`, `PLUGIN_DIR` override)
- `src/registry.ts` — filesystem discovery of installed plugins
- `src/installer.ts` — ZIP install/upgrade with validation:
  - 50 MB / 2000 files limits, zip-slip path rejection
  - plugin.json must exist at root or one top-level dir
  - referenced admin entry must exist in ZIP
  - extract to temp dir then atomic rename (supports upgrades via allowReplace)

### 2. Database
- `Plugin` model in schema.prisma (slug unique, name, version, description, author,
  active, manifest Json, installedAt, updatedAt)
- Migration `20261005000000_plugin_system/migration.sql`

### 3. Permissions
- `plugins.read`, `plugins.install`, `plugins.activate`, `plugins.delete` in catalog
- NOTE: seed must grant these to owner/admin roles (not yet done — verify on deploy)

### 4. Admin UI
- `/plugins` page (`plugins-admin.tsx`): ZIP upload/install, table with
  Activate/Deactivate/Open/Delete, missing-file warnings
- `/plugins/[slug]/page.tsx`: renders active plugin's admin entry via runtime
  dynamic `import()` (webpackIgnore — not bundled at build time)
- `/api/plugins/[slug]/[...path]/route.ts`: dispatches GET/POST/PUT/DELETE to
  plugin's exported handlers
- Sidebar: static "Plugins" nav item + dynamic active-plugin menu entries
  (via `getActivePluginMenuAction`, passed from dashboard layout)
- `listPluginsAction` auto-creates + activates DB rows for manifests with
  `autoActivate: true`

### 5. WordPress import logic extracted
- `packages/content/src/wordpress-import.ts`: `runWordPressImport(options)` —
  the 887-line CLI script refactored into a parameterized, importable module
  (wpBaseUrl, credentials, siteSlug, storageRoot, mediaPublicBase, prisma, onProgress)
- Exported from `@varka/content` index
- Typechecks clean

### 6. wordpress-import plugin (v1.0.0, bundled)
- Source: `plugins/wordpress-import/src/` (admin.tsx, handlers.ts, entry.ts)
- Built: `dist/entry.js` via esbuild (14.5 KB, ESM, deps external)
- Installable ZIP: `plugins/wordpress-import/wordpress-import-v1.0.0.zip`
- Pre-installed (committed): `apps/admin/plugins/wordpress-import/`
  (plugin.json + dist/entry.js force-added despite dist/ gitignore)
- Manifest has `autoActivate: true` → active on first admin load
- Admin page: WP URL form, optional app-password, Test connection + Start import
  (plain HTML forms, no client JS), status card, recent log viewer
- Handlers: POST `test` (checks /wp-json/wp/v2/types), POST `start`
  (background import with status in `import-status.json`), GET `status`

## Push notes
- 27 files pushed via GitHub MCP `push_files` (commit 6ab7e78)
- `pnpm-lock.yaml` (279 KB) SKIPPED — hits MCP argument size limits (~270 KB).
  Vercel uses `--no-frozen-lockfile` so builds work. User should run
  `pnpm install` locally to regenerate the lockfile and push it.
- Binary ZIP not pushed via MCP (text-only); source + dist committed, ZIP
  rebuildable via `plugins/wordpress-import/build.mjs`

## Remaining / verify on Vercel
1. Prisma migration must be applied to the production DB (`db:migrate`)
2. Owner/admin roles need the new `plugins.*` permissions (check seed)
3. Visit `/plugins` — wordpress-import should auto-activate and show "WP Import"
   in the sidebar
4. Test connection to celebrtiy.com from the plugin page
5. Vercel filesystem is ephemeral — plugin ZIP uploads and import-status.json
   won't survive redeploys; VPS is the real target
