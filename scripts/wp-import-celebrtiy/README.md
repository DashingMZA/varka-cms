# celebrtiy.com → VARKA WordPress import

One-shot, idempotent importer that pulls the **public read-only** WordPress REST API of
`https://celebrtiy.com/wp-json/wp/v2/` (the user's celebrity-biography blog) into the
VARKA PostgreSQL database. No auth, no logins, no form submits — only public GETs.

## What it imports

| WordPress | VARKA |
|---|---|
| Categories (with parent hierarchy) | `Category` + `CategoryTranslation` |
| Tags | `Tag` + `TagTranslation` |
| Posts (`publish`→`PUBLISHED`, `draft`→`DRAFT`, `pending`→`PENDING_REVIEW`, `future`→`SCHEDULED`, `private`→`DRAFT`; `publishedAt` from WP `date`) | `Post` + `PostTranslation` (`contentHtml` = `content.rendered`, `excerpt` = `excerpt.rendered` stripped of tags) |
| Post ↔ category / tag links | `PostCategory` / `PostTag` |
| Pages (About, Contact, Privacy Policy, Terms of Service, Cookie Policy, Disclaimer, DMCA, …) | `Page` + `PageTranslation` |
| Authors (from `_embedded.author`) | minimal `User` (disabled stub) + `AuthorProfile`, linked via `Post.authorProfileId` |
| Featured images + every `celebrtiy.com` image inside content HTML | downloaded to local storage, `MediaAsset` rows (`storage='local'`), `Post.featuredImageId` set, and **celebrtiy.com URLs in `contentHtml` rewritten to the local public URLs** — nothing is hotlinked |

It also upserts:

- Site `varka` (created if missing), default English `Language` row (created if missing).
- `SiteSetting` rows: `theme.active` = `theme-11`, `site.tagline` = `The Private Lives Of Public Figures`, `site.footer_text` = `© <current year> Celebrtiy | The Private Lives Of Public Figures - All Rights Reserved.`

## Prerequisites

- Node >= 22 (repo engines require >= 24).
- `pnpm install` completed at the repo root (the script loads `pg`, `@prisma/client`, `@prisma/adapter-pg` from `packages/database`).
- `DATABASE_URL` in the **repo-root `.env`** — the same database the admin app uses. It must point at a **local/dev** database; the script refuses non-localhost hosts unless `IMPORT_ALLOW_REMOTE_DB=1` is set.

## Usage

```bash
pnpm db:import:celebrtiy
# which runs: pnpm --filter @varka/database import:celebrtiy
# → tsx scripts/wp-import-celebrtiy/import.ts
```

The script runs with `tsx` (already a devDependency of `@varka/database`; the same runner `packages/database` uses for its seed script). Optional env overrides:

- `WP_BASE_URL` — WP REST base (default `https://celebrtiy.com/wp-json/wp/v2`)
- `IMPORT_SITE_SLUG` — target site (default `varka`)
- `LOCAL_STORAGE_PATH` — where media files are written, relative to repo root (default `.storage`; must match the value `apps/admin` uses)
- `MEDIA_PUBLIC_URL` — public URL prefix for stored media (default `/api/media/file`, which `apps/admin` serves at `src/app/api/media/file/[...key]`; must match the value `apps/admin` uses)

## Idempotency

Safe to re-run: posts/pages/categories/tags upsert on the schema unique `(languageId, slug)`; media downloads are skipped when `(siteId, key)` already exists (the storage key is deterministic: `wp-import/YYYY/MM/wp-<wpMediaId>-<filename>`, the same WordPress-style `YYYY/MM` layout the `@varka/media` local adapter uses); post↔category/tag links are rebuilt per post. A re-run updates existing rows instead of duplicating them.

## Rate limiting

Polite by design: ~250ms delay between HTTP requests, 3 retries with exponential backoff (1s/2s/4s), 30s request timeouts, `per_page=100` pagination with `_fields` to keep payloads small, and progress logging per phase.

## Notes / caveats

- Imported authors get disabled stub `User` rows (`wp-author-<id>@celebrtiy.local`) so `AuthorProfile.userId` (unique, required) is satisfied; they cannot log in.
- Only images (`image/*` MIME) are downloaded; other media types are skipped with a log line.
- `celebrtiy.com` URLs in content that don't match any known WP media item (e.g. deleted uploads) are left as-is and counted in the log.
- `Page` has no author relation in the VARKA schema, so page authors are not linked.
- The media-serving path assumes `apps/admin`'s `/api/media/file/[...key]` route (or `MEDIA_PUBLIC_URL`) — the Astro public site serves images through the same storage layout.
