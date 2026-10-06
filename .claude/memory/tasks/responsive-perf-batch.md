# Responsive shell repair + performance + i18n wiring (2026-10-06)

## Ask
User's screenshots showed the whole admin broken on mobile/small screens (blank content,
cut-off topbar, drawer issues) plus a Lighthouse report with 5.8s TTFB waterfall on
/dashboard. Fix responsive globally, fix the server waterfall, no hardcoding, push once
tested so the user can pull and verify.

## Changes

### Responsive shell (apps/admin/src/app/globals.css, components/admin-topbar.tsx)
- **Critical fix**: below 782px `.v-admin` becomes 1 column but `.v-main` kept
  `grid-column: 2` → content rendered in an implicit off-canvas column (blank page +
  horizontal scrollbar). Now `.v-main { grid-column: 1; grid-row: 2; }` on mobile.
- Desktop grid changed to `var(--wp-sidebar-w) minmax(0, 1fr)` so wide content can no
  longer blow the grid past the viewport (topbar right side was cut off at 960–1280px
  in screenshots).
- Topbar: `white-space: nowrap; flex-shrink: 0` on links (was wrapping "View Site" /
  "Log Out" into two lines); on ≤782px hide Media link, View Site link and the
  language label, shrink brand (min-width 0) and locale select (110px) — added
  `v-topbar__media-link` / `v-topbar__view-site` classes for this.
- Sidebar drawer: `left: 0` → `inset-inline-start: 0` (RTL-safe).
- `.v-dash-grid`: `minmax(min(280px, 100%), 1fr)` + `min-width: 0` on children so cards
  never overflow narrow screens.
- `<main>` landmark: `(dashboard)/layout.tsx` (`div.v-main` → `main`), login page
  wrapper → `main` (Lighthouse a11y: document had no main landmark).

### Performance (DashboardLayout waterfall)
- `resolveSession()` and `getAuthContext()` wrapped in React `cache()` — one request
  resolves the session once even when layout + actions each ask (was 2+ Better Auth
  internal-handler calls per request).
- Layout: color-scheme DB query and `getActivePluginMenuAction()` now run in
  `Promise.all` instead of sequentially.
- `discoverInstalledPlugins()` (reads every plugin manifest from disk) cached 30s in
  memory; new `invalidatePluginDiscoveryCache()` called from install/delete plugin
  actions; exported from `@varka/plugins`.
- Deleted dead duplicate `apps/admin/src/lib/session.ts` (nothing imported it).

### i18n
- Subagent filled **408 missing keys** (9 namespaces × en/ar/es/ur) that rendered as raw
  keys in the UI (e.g. `welcomeTitle`, `quickDraftContent` visible in screenshots).
  Re-scan: 0 missing.
- Wired 16 previously dead locale files into `locale-registry.ts` (ar/es/ur:
  editor, plugins, posts, tools, widgets; ur: errors) — they existed on disk since
  0b5f180 but were never imported, so those namespaces silently fell back to EN.
  Also wired newly created es/auth.json, es/errors.json, ar/errors.json.
  Verified: every locale file on disk is imported and used by its bag; enBag covers
  all MESSAGE_NAMESPACES.

## Verification
- `tsc --noEmit`: PASS (0 errors)
- `next build` (production): PASS, all routes compiled
- `oxlint` on changed files: 0 errors; fixed 1 pre-existing warning (moved `signOut`
  out of component scope in admin-topbar)
- Dev server: /dashboard 200, /login 200
- Live visual check at 375/768/1280px NOT possible in sandbox: the bundled Chromium
  hard-blocks all local-network access (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS)
  and the managed browser task failed to reach localhost. CSS fixes are logically
  verified (compiled output inspected); user to pull and visually confirm.

## Follow-ups
- User to `git pull` and check 320/375/412/768/1024/desktop widths + RTL.
- When Vercel deploy limit resets (~24h after 2026-10-06 00:20 PDT): deploy latest main
  (includes new-post Loading fix 5ff936d) and live-test /content/posts/new.
- Route-by-route responsive audit continues (celebrtiy line-by-line parity).

## Follow-up fix (same day)
- `errors.networkError` was filled as "Upload failed" but is used in generic contexts
  (comments/pages/posts error states) — corrected to "Network error. Try again." in
  all 4 locales, committed as 1cf8177 and pushed.
- Posts Trash view empty: `listPostsAction` always applied `deletedAt: null`, hiding
  trashed posts (trash sets deletedAt). Trash view now uses `deletedAt: { not: null }`;
  trash count fixed too. Dashboard At-a-Glance counts now exclude trashed posts.
  Committed as f36048b and pushed. Note: user's dev log showed old `status: "TRASH"`
  code — they must `git pull` before retesting.

## Skills used
- `.claude/skills/wp-admin-dashboard/SKILL.md` (required admin skill)
- references/design-system.md (checked pre-compaction)

## Responsive batch 2 (2026-10-06, pushed as 853a895)
User reported Categories/Tags pages broken on small screens (fixed 300px+1fr
inline grid overflowed). Audited all admin routes page-by-page for fixed inline
grids/flex headers:
- Categories/Tags: `.v-tax-grid` (300px+1fr desktop, 1 col mobile)
- Redirections add-form: `.v-grid-3` stacks on mobile
- `.v-list-table-bottom`: flex-wrap (plugins-admin inline style removed)
- space-between flex headers (404 monitor, form editor, dashboard welcome): wrap
- Posts/pages/media/comments/users/themes/menus/widgets/tools/seo/settings/
  languages/updates already used responsive patterns (auto-fit grids, stacked
  tables, wrapping toolbars). tsc 0 errors, build OK, oxlint 0 errors (2
  pre-existing _count warnings).
