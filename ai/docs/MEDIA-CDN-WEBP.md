# WebP compression tradeoffs & CDN delivery

## WebP quality

| Quality | Typical use | Tradeoff |
|--------|-------------|----------|
| 60–70 | Aggressive thumbnails | Small files; artifacts on sharp edges/text |
| **75 thumb / 80 body** (default) | Photos in posts | Balanced size vs quality |
| 90+ | Hero / print-like | Large; little visual gain vs 80 |

Env (see `.env.example`):

- `MEDIA_WEBP_QUALITY_THUMB` (default 75)
- `MEDIA_WEBP_QUALITY` (default 80)

**Original files are never recompressed.** Only thumbnail/medium/large are WebP.

## CDN image delivery

Recommended production path:

1. `STORAGE_DRIVER=s3` with R2/S3
2. Set `MEDIA_CDN_URL` to a public CDN origin (R2 custom domain, CloudFront, Fastly)
3. Optional `MEDIA_CDN_PREFIX` if objects live under a path prefix

Benefits: edge cache, TLS offload, lower origin load. Local dev can keep `STORAGE_DRIVER=local` and `/api/media/file/…` with long `Cache-Control` + ETag.

Future: Cloudflare Image Resizing / imgproxy for on-the-fly width — not required when pre-generated sizes exist.
