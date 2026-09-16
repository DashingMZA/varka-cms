# Media sizes, security, WebP & revisions

## Image upload

1. MIME allow-list + **magic bytes** (`assertSafeImagePayload`) — rejects non-images.
2. **sharp** converts to WebP and builds sizes:
   - `thumbnail` max width 150
   - `medium` max width 300
   - `large` max width 1024
   - `full` original dimensions as WebP
3. All variants stored on disk/S3; `MediaAsset.key` points at **full** WebP.
4. `MediaAsset.sizes` JSON maps size name → `{ key, width, height, mimeType, sizeBytes }`.

## Revisions

- Created on each post update (`packages/content/src/posts.ts`).
- List/restore: `packages/content/src/revisions.ts` + admin API routes.
- Restore replaces translation title/HTML and increments post version.

## Autosave interval

- Setting key: `admin.autosaveIntervalMs`
- API: `GET|PUT /api/settings/autosave`
- UI: `/settings` → Autosave panel
- Bounds: 1000–120000 ms
