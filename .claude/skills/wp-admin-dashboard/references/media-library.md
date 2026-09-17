# Media Library

## Library screen
- View toggle: **Grid** (thumbnail masonry, hover shows filename + type icon) and
  **List** (uses the generic `list-table-pattern.md`: filename, author, uploaded-to post,
  date, file size).
- Filters: media type (Images / Video / Audio / Documents), date-uploaded dropdown,
  search by filename/alt text.
- Bulk select in grid mode too (checkbox appears on hover/select-mode toggle) for bulk
  delete.

## Upload
- Drag-and-drop dropzone at the top of the library (and inside every "Set featured
  image" / "Insert media" modal).
- Multi-file upload with a per-file progress bar; on completion each file becomes
  selectable immediately.
- Client + server-side validation: allowed MIME types/extensions, max file size, image
  dimension limits — reject with a clear inline error, never a silent drop.
- Paste-from-clipboard image upload support in the content editor.

## Attachment details (side panel or modal)
- Large preview.
- Editable: **Alt text** (required prompt for images, accessibility), **Caption**,
  **Description**, **Title**.
- Read-only: filename, upload date, uploaded-by, file type, size, dimensions.
- Actions: **Copy URL**, **Download**, **Edit Image**, **Delete Permanently** (confirm
  modal — deleting also warns if the file is attached/used elsewhere before removing).
- "Uploaded to" — link to the post/page it's attached to, if any.

## Edit Image tool
- Crop (freeform + fixed-ratio presets), rotate 90°, flip horizontal/vertical, scale to
  custom dimensions. "Save" creates/updates size variants; "Restore Original" undoes all
  edits (keep the original file untouched, mirroring WP's non-destructive edit history).

## Insert-into-content flow
- From the editor, "Add Media" opens the library in a modal (upload tab + browse tab),
  supports multi-select for a gallery block, and on insert lets the user choose an
  **image size** (thumbnail/medium/large/full or custom) and **alignment**
  (left/center/right/none) before inserting.

## Storage
- Store files in object storage (S3-compatible / Cloudinary / UploadThing), not the
  app server's local disk — generate responsive size variants on upload (or on-demand via
  an image CDN) instead of WP's fixed thumbnail/medium/large regeneration.
