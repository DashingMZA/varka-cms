# VARKA — current memory (agent status)

**Updated:** 2026-09-17 (autosave settings, revisions, WebP media)

## Product

- **VARKA** — Astro public + Next 16.3.5 admin + Prisma 7.10 + PostgreSQL
- pnpm 12.4.2 · Node ≥24 · TypeScript 7.0.2 (no downgrade)

## Media pipeline

- Upload images: **magic-byte security** (JPEG/PNG/GIF/WebP only)
- Convert to **WebP** (sharp)
- Generate sizes: **thumbnail (150)** · **medium (300)** · **large (1024)** · **full**
- Stored in `MediaAsset.sizes` JSON + primary `key` = full WebP
- Non-images (pdf/video/audio) stored as-is

## Revisions

- Every post `updatePost` writes `Revision` row
- API: `GET/POST /api/posts/[id]/revisions` (list + restore)
- UI: Revisions panel on post editor

## Autosave

- Empty title → never save
- Interval from `SiteSetting` key `admin.autosaveIntervalMs` (default 2500)
- Customize: **Settings → Autosave** (`/settings`)
- `useAutosave` loads interval from `/api/settings/autosave`

## Admin CMS (summary)

Posts/pages WP list + full editor sidebars; media grid + SEO alt/title; direct DB for public site.

## After pull

```bash
pnpm install
pnpm db:generate
# apply migration media sizes if needed:
pnpm --filter @varka/database exec prisma migrate deploy
```
