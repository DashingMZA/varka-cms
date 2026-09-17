# Media sizes, original, settings, insert

## Original vs derivatives

- **Original** is stored **unchanged** (same bytes, format, dimensions).
- **thumbnail / medium / large** are **WebP** derivatives only (max width from settings).
- Defaults: 150 / 300 / 1024 px (Settings → Media).

## Folder structure

- Default: `YYYY/MM/{id}-{basename}.ext` (WordPress-style).
- Toggle: Settings → “Organize uploads into year/month folders”.

## Attachment fields

- title, alt, **caption**, **keywords**

## Insert into post

- Editor **Image** opens media picker → choose **thumbnail | medium | large | original** → insert.

## Caching

- Local file route: `Cache-Control: public, max-age=31536000, immutable` + **ETag** / 304.

## Security

- Magic-byte validation on image upload; SVG not accepted as raster pipeline.
