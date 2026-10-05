# WP-parity batch 3 — Media library upgrades

Date: 2026-10-05

## Ask
WP-parity: celebrtiy wp-admin Media Library has grid/list view toggle,
type+date filters, search, bulk delete, and rich list-view row actions.
VARKA had grid-only with no filters.

## Changes
- `packages/media/src/service.ts`: `listMedia` opts += `mimePrefix?: string`
  (mimeType startsWith) and `month?: string` ("YYYY-MM" → createdAt gte/lt range).
- `apps/admin/src/actions/media.ts`: `listMediaAction` passes mimePrefix/month
  through; new `bulkDeleteMediaAction(ids)` (media.delete permission, up to 100,
  skips individual failures, revalidates /media).
- `apps/admin/src/components/media-library.tsx`:
  - Grid/List view toggle (▦ / ☰) in toolbar
  - Type filter dropdown (All/Images/Audio/Video/Documents) — server-side
  - Date filter dropdown (months derived from loaded items) — server-side
  - Search box — client-side across loaded items (filename/title)
  - Bulk select (checkboxes in list view, select-all) + bulk "Delete (n)"
  - List view table: checkbox, thumbnail, title+filename, date, size,
    row actions (Edit, View, Copy URL, Delete)
  - Refactored single delete into `removeById` (row action no longer depends
    on async selected-state update)

## Verification
- `tsc --noEmit` clean; full `pnpm --filter @varka/admin build` PASS.
- Pushed via GitHub MCP (service.ts, actions/media.ts pushed as own commits;
  media-library.tsx landed via the shared-tree push — verified identical
  md5 across local HEAD, origin/main, working tree).
- Note: parallel i18n workstream is pushing to the same files; a SHA-mismatch
  retry showed the file already contained the changes. Always verify post-push
  with `git show origin/main:<path>`.

## Follow-ups
- Batch 4: Tools → Export + Scheduled Actions; SEO 404 monitor + redirections.
