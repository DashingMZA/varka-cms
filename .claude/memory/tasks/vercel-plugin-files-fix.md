# vercel-plugin-files-fix

Date: 2026-10-05

## Ask
User reported (via browser run) that the deployed VARKA admin's WP Import
plugin page 404s and the Plugins page shows "Import from WordPress v1.0.0 —
Files missing (e.g. ephemeral disk). Re-install the ZIP.", status Inactive.
Import could not start.

## Root cause
The plugin system loads `apps/admin/plugins/<slug>/` from disk at request
time, and file tracing deliberately skips those paths (`turbopackIgnore`
comments in `packages/plugins/src/paths.ts` + `webpackIgnore` on the dynamic
imports). With `output: 'standalone'`, Vercel's function bundles therefore
never contain the preinstalled plugin files — `discoverInstalledPlugins()`
finds nothing, DB rows render as "files missing", plugin goes inactive, and
`/plugins/wordpress-import` 404s (its loader requires an active row + files).

## Changes
- `apps/admin/next.config.ts`: added `outputFileTracingIncludes` forcing
  `./plugins/**/*` into the function bundles of every route that touches
  plugins: `/plugins`, `/plugins/[slug]`, `/api/plugins/[slug]/[...path]`,
  `/api/system/sync-plugins`.
- Verified: `tsc --noEmit` clean for the config change.
- Committed locally as `583d72c` ("fix(vercel): include plugin files in
  function bundles via outputFileTracingIncludes").

## Not done
- **Not pushed to GitHub**: shell `git push` has no credentials in this env
  (`gh` not logged in either). Pushed via the GitHub MCP
  `create_or_update_file` instead — but the write approval timed out and the
  action was not performed. The fix is committed locally only; needs a
  re-attempted push (or user approval of the GitHub write) before Vercel
  redeploys.

## Follow-ups
- After the push + Vercel redeploy, re-check `/plugins/wordpress-import`
  renders and the plugin shows Active with files present.
- Even with the page fixed, the full WP import should NOT run on Vercel:
  serverless kills the fire-and-forget background import, the bundle dir is
  read-only (`writeStatus` → EROFS), and `./public/uploads` is ephemeral.
  The reliable path is the local CLI import:
  `git pull` → `db:migrate` → `db:seed` →
  `IMPORT_ALLOW_REMOTE_DB=1 WP_USERNAME=<user> WP_APP_PASSWORD=<app-pw> pnpm db:import:celebrtiy`.
- Note: a "varka-import" application password was created on celebrtiy.com
  (user adminxeebee) during the browser run; the generated secret was shown
  once in the browser and was intentionally not relayed in chat.
