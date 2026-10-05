# i18n Batch 3 — Final (2026-10-05)

## Ask
Convert ALL remaining admin components and app pages with hardcoded user-visible strings to the `useMessages` + `L()` i18n pattern. User requirement: "kuch b hard coded na ho" — no visible hardcoded strings anywhere in the dashboard.

## Changes

### Restored batch-1 stash
Parent had stashed (not lost) batch-1 work before a rebase. Recovered via `git checkout stash@{1}/stash@{0} -- <files>`:
- `page-create-form.tsx`, `page-editor.tsx`, `user-new-form.tsx`
- `en/pages.json`, `en/users.json`, `ur/users.json`
- (ar/es `pages.json`/`users.json` had survived as untracked files)

### Components converted (10)
| File | Namespace | Keys |
|------|-----------|------|
| `audit-log-viewer.tsx` | `security` | when, action, actor, entity, ip, noAuditEvents, loadFailedStatus (+common.refresh) |
| `autosave-settings.tsx` | `settings` | autosave, autosaveDesc, intervalSeconds, allowedRange, intervalSet, saveSettings, saveFailed (+common.saving) |
| `insert-image-modal.tsx` | `media` | insertImage, insertMedia, size, selectImageHint, insertIntoPost (+common.cancel) |
| `post-create-form.tsx` | `posts` | creatingDraft |
| `revision-history.tsx` | `posts` | revisions, noRevisions, noTitle, restore, restoreRevisionConfirm, restoreFailed, loadRevisionsFailed |
| `roles-matrix.tsx` | `security` | capabilityMatrix (+suffix split for `<code>` tag), permission |
| `system-health.tsx` | `dashboard` | loadingHealth, status, cache, database, queueDepth, healthOk, healthDegraded, lastCheck, networkError, healthStatus (+common.refresh) |
| `theme-picker.tsx` | `themes` | themesRegistered, activatedTheme, activateFailed, loadFailed, activeLabel, publicSiteLabel, optionalEnvLabel (reused existing `active`, `activate`) |
| `list-table/list-table.tsx` | `tables` | bulkActions, searchPlaceholder, noItemsFound (+common.apply/search) |
| `screen-meta/screen-meta.tsx` | `tables` | screenOptions, showOnScreen (+common.help) |

### App pages converted to client components (10)
- `appearance/page.tsx`, `appearance/menus/page.tsx`, `appearance/themes/page.tsx`, `appearance/widgets/page.tsx`
- `content/pages/[id]/page.tsx` (async → uses React `use()` for params)
- `content/tags/page.tsx`, `languages/page.tsx`, `system/page.tsx`, `users/new/page.tsx`, `users/roles/page.tsx`

### Removed
- Deleted dead unreferenced `components/media-settings.tsx` (the live `/settings/media` route uses its own converted page component; verified zero imports).

### Locale files
- New keys added to `security`, `settings`, `media`, `posts`, `dashboard`, `themes`, `tables`, `appearance`, `tags`, `language`, `users` across en/ar/es/ur.
- Created missing `ar`/`es`/`ur` files: `security.json`, `themes.json`, `tables.json` (full translations, matching key counts).
- Placeholder pattern: `{status}`, `{min}`, `{max}`, `{s}`, `{count}`, `{themeId}` with `.replace()` (matches batch-1 precedent).

### Skipped (no user-visible strings)
- `html-attrs.tsx` — returns null, only sets `<html>` attributes.
- `post-editor-revisions-slot.tsx` — thin wrapper, no strings.

## Verification
- `npx tsc --noEmit -p tsconfig.json` in `apps/admin` — PASS (fixed one variable-shadowing error in theme-picker where `.map((t)` shadowed the i18n `t`; renamed to `th`).
- Final audit: zero components and zero app pages with hardcoded user-visible strings and no i18n hook.
- Committed as `0b5f180`.

## Skills used
- `.claude/skills/wp-admin-dashboard/SKILL.md` — not directly needed (i18n conversion, no feature work); followed the established `plugins-admin.tsx` L() pattern per parent instructions.

## Follow-ups
- Parent's in-progress media-library upgrades (`actions/media.ts`, `components/media-library.tsx`, `packages/media/src/service.ts`) were left untouched — recovered one accidental discard via `git fsck` dangling blob.
- Pre-existing `dashboard.json` key-count mismatch across locales (ar:29, en:27, es:15, ur:15) predates this batch; L() fallbacks cover missing keys.
- Push to origin/main pending (parent handles via GitHub MCP).
