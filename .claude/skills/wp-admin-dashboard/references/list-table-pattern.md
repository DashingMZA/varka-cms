# The List-Table Pattern (Posts / Pages / Media / Users / Comments)

Build **one** generic, typed table component and configure it per entity — this is the
single most-reused piece of wp-admin.

## Header row
- Status tabs, each with a count: `All (n) | Published (n) | Drafts (n) | Trash (n)`
  (Comments uses `All | Pending | Approved | Spam | Trash`; Users uses role filter instead).
- Right-aligned: search box (searches title/content or name/email depending on entity).

## Toolbar row
- Bulk actions dropdown (`Edit`, `Move to Trash`, entity-specific ones like `Change role`)
  + "Apply" button — disabled until ≥1 row checked.
- Secondary filters: category/taxonomy dropdown, date-range dropdown, role dropdown (Users),
  comment-type dropdown — "Filter" button applies them together with search.
- Right-aligned: **Screen Options** (choose visible columns + rows-per-page) and **Help**
  disclosure panels.

## Table
- Checkbox column (+ header "select all on this page" checkbox).
- Sortable column headers (click toggles asc/desc, shows arrow) — Title/Name, Author,
  Categories, Date/Status, Comment count, etc. depending on entity.
- Row hover reveals inline action links: `Edit | Quick Edit | Trash | View | Duplicate`
  (only actions the user's role/capability allows).
- Quick Edit expands the row in place into an inline form (title/slug/status/date/category
  without leaving the list) — save via server action, no page reload.
- Empty state: icon + message + primary CTA ("No posts yet — Add your first post").

## Footer
- Pagination: "N items" count, First/Prev/Page-input/Next/Last, matches items-per-page from
  Screen Options.
- Bulk action controls repeated at bottom for long lists.

## Trash behavior
- Trashing is a soft delete (status flag), reversible via "Restore" action while row is in
  Trash tab, with an "Empty Trash" button that permanently deletes (with a confirm modal).
- Auto-purge trashed items after a configurable retention period (e.g. 30 days) via a
  scheduled job.

## Responsive behavior
- Below ~782px, convert the table to stacked cards: each row becomes a card, column labels
  shown inline as small caps labels next to each value (mirrors WP's mobile list-table
  collapse).

## Data fetching
- Server-side pagination/sorting/filtering (don't ship the full dataset to the client) —
  Route Handler or Server Action accepts `{page, perPage, sort, dir, filters, search}` and
  returns `{rows, totalCount}`.
