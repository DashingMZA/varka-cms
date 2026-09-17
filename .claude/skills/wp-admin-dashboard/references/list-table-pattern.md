# List-table pattern (Posts / Pages / Media / Users / Comments)

WordPress `WP_List_Table` equivalent for VARKA admin.

## Required UI elements

1. **Page title** + primary **Add New** button
2. **Subsubsub status filters** — All | Published | Draft | Trash (with counts)
3. **Tablenav** — bulk actions select + Apply, search box
4. **Table** — checkbox column, primary title column with row-actions on hover
5. **Columns** vary by entity; Screen Options may toggle optional columns
6. **Pagination** when >1 page

## Row actions

- Primary: Edit (link to editor)
- Trash / Delete
- Optional: View, Quick Edit, Duplicate

## Bulk actions

- Move to Trash / Restore / Delete permanently
- Status change (publish / draft) where applicable

## Data

- Server-side filter by status + search query params
- Never fake empty rows as success — empty state copy is required

## Implementation in VARKA

- Posts: `apps/admin/src/components/posts-admin.tsx`
- Pages: `apps/admin/src/components/pages-admin.tsx`
- Shared CSS: `.v-table`, `.v-tablenav`, `.v-subsub`, `.row-actions`
