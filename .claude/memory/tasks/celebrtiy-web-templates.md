# Celebrtiy web templates (Astro, theme-11)

- **Date:** 2026-10-04
- **Ask:** Build the Celebrtiy theme templates in `apps/web` (Astro 7, output 'server') against the exact `celebrtiy-*` CSS class names from the theme-11 package. Nothing hardcoded: nav from DB categories, footer links from published Pages, site name/tagline/footer text from Site/SiteSetting. New routes: page/[slug], category/[slug], tag/[slug], author/[slug], search.astro. Existing routes gain a Celebrtiy branch and keep their generic markup otherwise. Do not push to GitHub; do not run `pnpm install`.

## Changes

- `apps/web/src/celebrtiy/lib/data.ts` — new data layer (direct Prisma via `@varka/database`, site slug `varka`, [] / null on error). Types `CelebrtiyPostCard`, `CelebrtiyPostDetail` (+ related), nav/footer/site-info types. Functions: `isCelebrtiyTheme()` (resolveActiveThemeId() === 'theme-11'), `getSiteInfo()` (Site.name + SiteSetting keys `site.tagline`, `site.footer_text`, plus `site.more_info_title`/`site.more_info` for the MoreInfo block), `getNavCategories()` (categories with ≥1 published post, sortOrder, with counts), `getFooterPages()` (published pages by sortOrder), `getFeaturedPosts()` (latest with image), `getLatestPosts()`, `getPostsByCategory/Tag` (with totals for pagination), `getCategoryBySlug`, `listCategories`, `getTagBySlug`, `getAuthorBySlug` (+posts+total), `getPageBySlug`, `searchPosts` (title/excerpt ilike, 20), `getSidebarPicks`, `getSimilarPosts` (shared categories, fills with latest), `getPostDetail`.
  - Media URL convention (from `apps/admin/src/components/featured-image-panel.tsx` + `packages/media/src/driver.ts`): local assets → `<PUBLIC_API_URL>/api/media/file/<key>` (admin app serves that route; the web app is a separate origin so the URL is absolute); `MEDIA_PUBLIC_URL` env overrides; keys already starting with http(s) used as-is. Never hotlinks celebrtiy.com.
  - Translation picking: default-language translation first, else first; post paths via `postPath` from `@varka/i18n` (same as `packages/content`).
- `apps/web/src/celebrtiy/components/*.astro` — Header (sticky bar: pink logo from Site.name, tagline, Home + nav categories, circular search button), SearchDrawer (GET /search form), Footer (navy, footer pages, social placeholders, copyright from footer_text), PostCard (card suite + `celebrtiy-card--large` + `data-cats`), FeaturedGrid (`.celebrtiy-featured-main` wrapper + 4 small), CategoryQuickLinks (pills), CardRow (title + 4 cards + optional link), CategoryBlock (name/description/Continue Reading), TabCarousel (tabs + prev/next arrows + `data-tabs`/`data-carousel` hooks), BreadcrumbHero (lavender band, `»` separators, h1), SidebarTopPicks ("Top Picks For You"), SimilarPosts (reuses TabCarousel, no tabs), MoreInfo (renders only when DB html present), Pagination (base + ?page=).
- `apps/web/src/celebrtiy/layouts/CelebrtiyLayout.astro` — full shell: SEO/OG/JSON-LD via `siteSeo` (siteName from DB), Overpass 400/600/700/800 (+italic 800 for logo) Google Fonts link, theme CSS via `activeThemeWithCss()`, Header / `<main>` / Footer, one `is:inline` vanilla script for search-drawer toggle (`.open` class per theme CSS), tab filtering (`data-cats`), carousel arrows.
- Routes:
  - `src/pages/index.astro` — Celebrtiy home (FeaturedGrid, quick links, Latest Biographies, per-category block+row for first 4 nav cats, shuffled "Random Biographies" tabbed carousel, MoreInfo); generic markup untouched otherwise.
  - `src/pages/post/[slug].astro` — Celebrtiy single (breadcrumb hero, article card + SidebarTopPicks, SimilarPosts, MoreInfo; 404 status + styled not-found when missing). getStaticPaths kept; `pa/` routes untouched.
  - `src/pages/page/[slug].astro`, `category/[slug].astro` (12/page + Pagination + TopPicks row), `tag/[slug].astro`, `author/[slug].astro` (celebrtiy-author-box + grid), `search.astro` (?q=, noindex) — all new, each with simple BaseLayout generic fallback.
  - `src/pages/404.astro` — Celebrtiy-styled 404 when theme-11, existing generic otherwise.
- Section labels ("Latest Biographies", "Random Biographies", "Top Picks For You", "Similar Posts", "Continue Reading →") are theme chrome from the celebrtiy.com reference named in the spec; all site-specific copy (name, tagline, footer, descriptions, more-info) comes from DB.

## Skills used

- None directly (no admin-dashboard work; did not touch `apps/admin`). Followed repo AGENTS.md conventions (read AGENTS.md, content-api.ts/theme.ts patterns, theme-11 CSS class contract from the sibling agent's memory note).

## Gates (run 2026-10-04 ~23:12 PDT, after `pnpm install` completed)

- `pnpm --filter @varka/web build` — **PASS** (2.1s). Two pre-existing blockers fixed along the way:
  1. `apps/web/src/celebrtiy/lib/data.ts` had one extra `}` on the `_count` line in `getTagBySlug` (brace miscount — verified with tsc + minimal repros).
  2. `packages/content/src/index.ts` re-exported `getPost` and `trashPost`, neither of which exists in `packages/content/src/posts.ts` (MISSING_EXPORT build failure). Removed both from the re-export list — verified nothing imports them from `@varka/content` anywhere in the repo (`getPostAction`/`trashPostAction` in admin are unrelated server actions).
- `pnpm lint` (oxlint, whole repo) — **0 errors in new/changed files**; 5 warnings in `celebrtiy/lib/data.ts` (`no-underscore-dangle` on Prisma's `_count` — Prisma-canonical naming, non-blocking). The 4 repo-wide lint errors are pre-existing in untouched files (`apps/admin/.../settings/reading/page.tsx`, `scripts/wp-import-celebrtiy/import.ts`, `apps/admin/src/hooks/use-autosave.ts`, `packages/i18n/src/messages.ts`).
- Smoke test: booted `dist/server/entry.mjs`, `GET /` → 200 (generic VARKA home, theme-01 fallback since admin API is down), `/search?q=test` → 200 generic fallback, `/category/nope` → 404 with "Category not found". `pa/` routes untouched.
- Note: Astro warns `getStaticPaths() ignored in dynamic page` for `post/[slug].astro` (and the pre-existing `pa/post/[slug].astro`) under `output: 'server'` — pre-existing behavior, kept as instructed.
- The `site.more_info_title` / `site.more_info` SiteSetting keys are read but not seeded anywhere — the migration agent may want to seed them, otherwise the MoreInfo block stays hidden (by design, no hardcoded copy).
- `resolveActiveThemeId()` / `activeThemeWithCss()` hit `${PUBLIC_API_URL}/api/public/theme` per render (existing pattern from `lib/theme.ts`); consider caching if render latency matters.
- Did not edit `.claude/memory/tasks/README.md` (coordinator owns it).

## Coordinator verification & fixes (2026-10-04)
- `pnpm --filter @varka/web build`: PASS (rebuilt locally after agent finished).
- Pre-existing `@varka/content` bad re-exports (`getPost`, `trashPost`) fixed by agent; verified nothing imports them.
- Seeded `site.more_info_title`/`site.more_info` defaults in the WP import script so the MoreInfo block renders (reference copy from celebrtiy.com).
