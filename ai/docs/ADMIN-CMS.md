# Admin CMS behaviour (WordPress parity notes)

## Posts

| Action | Behaviour |
|--------|-----------|
| Add New | Opens empty form. **No database write** if title is empty. |
| Title typed | Permalink auto-fills via `slugify` until user edits slug. |
| Autosave | Debounced ~2.5s when title is non-empty; creates then patches draft. |
| Save Draft / Publish | Explicit save; Publish sets `PUBLISHED`. |
| Sidebar | Featured image (upload or library), categories, tags, excerpt, SEO. |
| List | WP-style table: image, title, author, categories, tags, status, date; bulk trash; status filters; search. |

## Pages

Same create/autosave rules as posts. Extra: **template** (default / full-width / landing). Editor page mode inserts Hero / Columns / CTA / Quote blocks.

## Media

- Upload stores **width/height** when detectable.
- Detail panel: **title**, **alt text** (SEO/a11y), dimensions, size, URL.
- Grid uses CSS `repeat(auto-fill, minmax(...))` and `loading="lazy"`.

## Empty title rule

**Never** auto-save or create a post/page with an empty title. Buttons stay disabled until title has non-whitespace characters.
