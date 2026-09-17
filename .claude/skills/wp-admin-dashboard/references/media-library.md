# Media Library

## Grid + list views
- Default grid of thumbnails; toggle list view (filename, type, size, date, author).
- Upload: drag-drop zone + file picker; multi-file; progress per file.
- Filters: type (image/video/document), date, search.

## Attachment details
- Side panel or modal: title, alt text, caption, description/keywords, file URL, sizes.
- Edit image (crop/rotate) optional later; delete with confirm.

## Insert into post (modal)
- From editor: open media modal, select asset, choose size (thumbnail/medium/large/full),
  Insert button returns HTML/figure to editor.
- Featured image flow reuses same picker.

## Derivatives
- On upload: keep original; generate WebP thumbnail/medium/large per settings.
- Security: magic-byte sniff, reject non-images when images-only, size limits.

## VARKA paths
- UI: `apps/admin/src/components/media-library.tsx`
- API: `apps/admin/src/app/api/media/`
- Package: `packages/media`
