# WordPress-style auto-draft — 2026-10-05

User complaint: opening /content/posts/new immediately created a DB draft with a
cuid URL (/content/posts/cmuw6upj...). Wanted: no draft on open, slug URLs,
auto-draft only when typing (like WordPress).

## What was done
- `apps/admin/src/app/(dashboard)/content/posts/new/page.tsx` — now renders
  `<PostEditor postId={null}>` directly; no `createPostAction` on mount.
- `apps/admin/src/components/post-editor.tsx`:
  - Accepts `postId: string | null`; `null` = new-post mode, no DB record.
  - `ensureDraft()` — creates draft via `createPostAction` on first meaningful
    input, then `router.replace(/content/posts/${slug})` for slug-based URL.
  - Auto-draft effect: 1.5s debounce after title/content change (WP-style).
  - `save()` — if no postId, calls `ensureDraft()` first, then saves.
  - Preview button disabled until draft exists; Trash button hidden until draft exists.
- `apps/admin/src/actions/posts.ts`:
  - `getPostAction(idOrSlug)` — looks up by id, falls back to translation slug.
  - `createPostAction` now returns `{ id, slug }`.

## Verification
- `npx tsc --noEmit` clean, `npx next build` succeeded.
- Pushed via github-pat (3/3 files).
- NOT live-tested (needs Vercel deploy + real editor flow).
- Pages (/content/pages/new) already correct — only creates on button click.
