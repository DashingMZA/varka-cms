# VARKA — current memory (agent status)

**Updated:** 2026-09-17

## Product

- Name: **VARKA**
- Stack: Astro public (`apps/web`) + Next.js 16.3.5 admin (`apps/admin`) + Prisma 7.10 + PostgreSQL
- Monorepo pnpm workspaces; TypeScript **7.0.2** (do not downgrade); ESLint path uses **oxlint** where TS-eslint conflicts
- Package manager: **pnpm@12.4.2**, Node **>=24**

## Data access

- **Web reads:** direct Prisma + `@varka/content` (no HTTP to admin for posts)
- **Admin reads:** RSC / packages where possible; client mutations via `/api/*` → same DB
- Shared root `.env` `DATABASE_URL`

## Admin CMS (WordPress-like)

### Posts
- List: status tabs, bulk trash, search, columns Image · Title · Author · Categories · Tags · Status · Date
- **Add New** → `/content/posts/new` — **no DB row while title empty**
- Title → auto permalink (until user edits slug)
- **Autosave** (~2.5s) only when title non-empty
- Full sidebar: Publish, Featured image (upload + media library), Categories, Tags, Excerpt, SEO
- Edit: same panels + Tiptap + version/optimistic lock

### Pages
- List / new / edit mirrors posts (template, SEO, trash)
- Page editor blocks: Hero, Columns, CTA, Quote (+ standard formatting)
- Autosave rules same as posts (no empty title)

### Media
- Grid + list, filter, search, dropzone
- Dimensions on upload (PNG/JPEG/GIF/WebP)
- Attachment SEO: title + alt (PATCH `/api/media/[id]`)
- Lazy-loaded grid images

### Other admin
- Dashboard counts (direct Prisma)
- Comments moderation, themes, SEO settings, audit, auth

## Public site
- Astro lists/detail from DB via `apps/web/src/lib/content-api.ts`
- Sitemap uses same

## Known / later
- `pg` parallel query deprecation warning (non-blocking)
- Full Gutenberg block package still optional; page uses HTML block inserts
- Production auth should replace dev-user API ctx where still present

## Recent commits theme
- Direct DB for web; featured image UX; media library grid; pages CMS; autosave + restore full post sidebar
