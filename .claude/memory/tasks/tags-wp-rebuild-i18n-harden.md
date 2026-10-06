# tags-wp-rebuild-i18n-harden

Date: 2026-10-05 (~8 PM PDT)
Ask: user (side chat, Roman Urdu): "tags wala page fix ni hova. uski ui celebrtiy jasi ni hoye" — tags page not fixed, UI not like celebrtiy/wp-admin.

## What was found
- An interrupted earlier session had rebuilt the admin Tags page WordPress-style
  (2-col: Add Tag form left with name/slug/description, table right with
  Name/Description/Slug/Count, Edit/Quick Edit/Delete/View row actions,
  bulk delete, pagination, search; new `updateTagAction`/`deleteTagAction`;
  `TagTranslation.description` + migration `20261005190000_tag_description`)
  but left it UNCOMMITTED — so production never got it.
- The rebuild had hardcoded English strings (regression vs the repo's
  zero-hardcoded-strings i18n bar).

## Changes (this session)
- Converted all hardcoded strings in `tags-admin.tsx` to i18n keys; added 7 keys
  (`quickEdit`, `loadFailed`, `createFailed`, `deleteFailed`, `updateFailed`,
  `deleteConfirm`, `deleteSelectedConfirm`) to `tags.json` in en/ar/es/ur.
- Row actions now use `t('common', ...)` for edit/delete/view/update/cancel.
- Verified: `tsc --noEmit` PASS, oxlint 0 errors (1 pre-existing `_count`
  no-underscore-dangle warning, same as committed categories-admin.tsx).
- The concurrent main-agent session committed the finished work as
  `445e6f1` ("fix: tags WP-style UI, use-server export, hydration mismatch")
  on the sandbox's local main — working tree clean.

## Critical: push blocked by divergence
- Sandbox local main has 48 commits not on origin/main; origin/main has 111
  not on local (another session pushed ~9 commits to origin DURING this run:
  "fix: tags UI + hydration + use-server" batches 1–6 and "refactor: admin
  Server Actions migration" batches 6–7).
- origin/main's tags batches fix hydration/use-server in the OLD ListTable UI
  but do NOT include the WordPress-style rebuild — the two lines conflict
  conceptually. DO NOT rebase/merge/push unilaterally; needs user/main-agent
  decision on which tags UI wins.
- Until reconciled, Vercel (deploys from origin/main) serves the old-UI tags
  page, so the user's complaint will persist on production.
- User still must run `pnpm db:migrate` on their machine for the
  TagTranslation.description column (sandbox cannot reach their Prisma Postgres).

## Follow-ups
- Decide: rebase local rebuild onto origin/main (resolving conflicts in
  tags-admin.tsx, taxonomy.ts, i18n.ts, locale-provider.tsx, layout.tsx),
  or drop local line and rebuild WP-style on top of origin's batches.
- Then single-commit push per user directive; verify Vercel deploy; user runs
  db:migrate.
- Note: `/content/tags/[id]` edit page does not exist (same gap in categories);
  Edit links 404 — consider a shared term-edit page or point Edit at Quick Edit.
