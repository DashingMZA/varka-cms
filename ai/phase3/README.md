# Phase 3: Media Library

**Status:** source complete  
**Depends on:** phase 2  

## Delivered

- `MediaAsset` model
- `@varka/media`: local adapter (tested), S3/R2 adapter factory, upload/list/delete services
- MIME allow-list, 25MB limit, SHA-256 checksum, path-safe keys
- Admin `/media` + `GET/POST /api/media`, `PATCH/DELETE /api/media/[id]`
- `STORAGE_DRIVER=local|s3|r2` (s3/r2 needs client injection)

## Local

```bash
# .env
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=.storage

pnpm --filter @varka/media test
pnpm --filter @varka/admin dev
# open /media
```
