# WP-parity batch 2 — Forms module (Contact Form 7 parity)

Date: 2026-10-05

## Ask
User wants the VARKA admin dashboard to match celebrtiy.com's wp-admin in
functions/features (not just the content import). Audit showed Contact Form 7
(Contact → Contact Forms / Add / Integration) has no VARKA equivalent —
biggest missing module.

## Changes
- `packages/database/prisma/schema.prisma`: `Form` model (name, slug unique,
  title, fields JSON, submitLabel, successMessage, mailTo, active) +
  `FormEntry` model (formId FK cascade, data JSON, ip, userAgent).
- `packages/database/prisma/migrations/20261005010000_forms/migration.sql`:
  CREATE TABLE IF NOT EXISTS for both + indexes.
- `packages/permissions/src/catalog.ts`: `forms.read/create/update/delete/entries`.
- `apps/admin/src/actions/forms.ts`: `ensureFormsSystem()` (creates tables,
  ensures permissions, grants to owner/admin — idempotent, Vercel-safe, same
  pattern as plugin system); list/get/create/update/delete forms;
  list/delete/bulk-delete entries. Slug validation, field sanitization
  (10 types, max 50 fields).
- `apps/admin/src/components/forms-list.tsx`: /forms list with shortcode,
  entries count, status; inline create form.
- `apps/admin/src/components/form-editor.tsx`: /forms/[id] editor with tabs
  Fields (settings + field builder: add 10 types, label/type/id/placeholder,
  required, options textarea, reorder up/down, delete) | Entries (paginated
  inbox, bulk delete) | Embed (shortcode + plain-HTML snippet + honeypot note).
- `apps/admin/src/app/(dashboard)/forms/page.tsx`,
  `app/(dashboard)/forms/[id]/page.tsx`: route wrappers.
- `apps/admin/src/app/api/public/forms/[slug]/submit/route.ts`: public POST
  (no auth) — honeypot `website` trap, required/email validation, 20-per-10min
  per-IP in-memory rate limit, stores entry, returns form successMessage.
- `apps/admin/src/components/admin-nav.tsx`: Forms menu item (✉) after Comments.

## Verification
- `tsc --noEmit` clean (fixed 3 errors: possibly-undefined index access).
- Full `pnpm --filter @varka/admin build` PASS — routes /forms, /forms/[id],
  /api/public/forms/[slug]/submit present.
- Drive-by fix (NOT mine, left uncommitted locally except caller): another
  in-flight change had altered `listMediaAction(limit)` → `listMediaAction(opts)`
  without updating `media-library.tsx:92`; fixed the caller to
  `listMediaAction({ limit: 100 })` so the tree builds. The media.ts change
  itself was NOT pushed (belongs to the other workstream).
- Pushed to origin/main via GitHub MCP `create_or_update_file` (10 files,
  one commit per file — noisy but fine). Vercel auto-redeploys; `db:generate`
  picks up the new models; tables self-create on first /forms visit.

## Follow-ups
- Next parity batches: media library upgrades (list view, date/type filters,
  bulk delete), Tools → Export + Scheduled Actions, SEO depth (404 monitor,
  redirections, per-post scores), Appearance Customizer (deferred).
- The `[varka-form]` shortcode is admin-display only for now; a web-side
  renderer (Astro) is future work — the plain-HTML embed works anywhere today.
