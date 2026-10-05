# celebrtiy.com WordPress REST import script

- **Date:** 2026-10-04
- **Ask:** Write an idempotent WordPress REST import script that pulls the public read-only API of https://celebrtiy.com/wp-json/wp/v2/ (user's celebrity-biography blog) into the VARKA database: categories/tags with hierarchy → Category/Tag + translations, posts/pages → Post/Page + translations (status mapping, publishedAt), WP authors → User + AuthorProfile, PostCategory/PostTag relations, featured media → downloaded + Post.featuredImageId, all celebrtiy.com images in contentHtml downloaded to local storage with URLs rewritten (no hotlinking), SiteSettings (theme.active=theme-11, tagline, footer_text with dynamic year), polite fetching (250ms delay, 3 retries, 30s timeouts).

## Changes

- `scripts/wp-import-celebrtiy/import.ts` — new (~600 lines, TS, run via `tsx`). Reuses the `prisma/seed.ts` Prisma 7 bootstrap pattern (pg Pool + PrismaPg adapter + loadRootEnv), but anchors module resolution at `packages/database/package.json` via `createRequire` so `pg`/`@prisma/client`/`@prisma/adapter-pg` resolve from the workspace package. Media stored by replicating the `@varka/media` local-adapter key/URL scheme (`wp-import/YYYY/MM/wp-<id>-<file>`, public URL `<MEDIA_PUBLIC_URL>/<key>` default `/api/media/file`, matching the `apps/admin` route `src/app/api/media/file/[...key]`). Idempotent: upserts on `(languageId, slug)` for translations, skips downloads on existing `(siteId, key)`, rebuilds PostCategory/PostTag per post. Safety: refuses non-localhost `DATABASE_URL` unless `IMPORT_ALLOW_REMOTE_DB=1`.
- `scripts/wp-import-celebrtiy/README.md` — new; prerequisites, usage, idempotency, rate-limiting, mapping table, caveats.
- `packages/database/package.json` — added `"import:celebrtiy": "tsx ../../scripts/wp-import-celebrtiy/import.ts"`.
- Root `package.json` — added `"db:import:celebrtiy": "pnpm --filter @varka/database import:celebrtiy"`.
- Did NOT edit `.claude/memory/tasks/README.md` (per task instruction; coordinator updates it).

## Skills used

- `prisma-safe` (read first per repo rules): confirmed `url` not in schema, generate/migrate commands; no migrations needed for this task.
- Studied `packages/database/prisma/schema.prisma` models directly (Site, SiteSetting, Language, Post/PostTranslation, Page/PageTranslation, Category/CategoryTranslation, Tag/TagTranslation, PostCategory, PostTag, MediaAsset `@@unique([siteId,key])`, AuthorProfile fields, ContentStatus enum) and `packages/media/src/{driver,local-adapter,service}.ts` for the key scheme (`uploads/YYYY/MM/<rand>-<base>`, `getUrl` = base + key) and the admin media-serving route.
- Did not need the wp-admin-dashboard skill (no admin code touched).

## Follow-ups

- **Import NOT run**: no `DATABASE_URL` in repo-root `.env` (no `.env` file at all, no Docker, no local DB). Script was verified with `tsc --noEmit` only. When a local/dev DB is available, run `pnpm db:import:celebrtiy` — it will upsert site `varka`, English language, all taxonomies/posts/pages, download media into `.storage`, and set the theme-11 site settings.
- Imported authors become disabled stub Users (`wp-author-<id>@celebrtiy.local`) to satisfy `AuthorProfile.userId`; they cannot log in.
- `Page` has no author relation in the schema, so page authors are intentionally not linked (unlike posts).
- Verified the WP REST index at celebrtiy.com is reachable; endpoints (`/posts`, `/pages`, `/categories`, `/tags`, `/media`) are standard wp/v2.
- Live-sampled one post (`per_page=1` with the exact `_fields` the script uses): confirmed field shape (`id,slug,status,date,modified,title,content,excerpt,featured_media,categories,tags,author,comment_status`). Noticed WP emits double slashes in content URLs (`https://celebrtiy.com//wp-content//uploads//…`), so `normalizeUrl` collapses `//` → `/` and the uploads filter tolerates `wp-content/+uploads`.

## Coordinator verification & fixes (2026-10-04)
- Script loads cleanly under tsx (hits DATABASE_URL guard as designed); live import not run — no DB in this environment.
- Fixed lint `no-unused-vars` on unused `opts` param (removed); remaining 3 repo lint errors are pre-existing in untouched files.
- Added `site.more_info_title`/`site.more_info` seed rows (homepage MORE INFO block).
