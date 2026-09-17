# Content editor (Posts / Pages)

## Layout
- Classic WP-style: main column (title, slug/permalink, body editor) + right sidebar meta boxes.

## Title & permalink
- Large title field; slug auto from title until manually edited.
- Empty title must not autosave a DB row (WP behavior).

## Body
- Rich editor (Tiptap) + optional HTML mode.
- Add Media → media modal insert with size picker.

## Meta boxes (sidebar)
- **Publish** — status, visibility, publish/schedule, Save Draft, Move to Trash, revisions link.
- **Featured image** — set/remove via media library.
- **Categories** — checklist + add new.
- **Tags** — multi-select / tokens + add new.
- **Excerpt**
- **SEO** — seo title, meta description (character guidance).

## Autosave & revisions
- Autosave only when title non-empty; interval from settings.
- Revision history list + restore.

## Screen Options
- Toggle meta boxes visibility; persist per user.

## VARKA
- `apps/admin/src/components/post-editor.tsx` (+ Tiptap, featured image panel)
