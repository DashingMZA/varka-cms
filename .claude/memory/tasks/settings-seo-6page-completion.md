# Settings/SEO 6-page completion + login button fix

Date: 2026-10-06
Branch: `fix/settings-seo-pages` on origin (2 commits: ed74abf, cca2ddf). NOT merged to main — user was pushing to main every few seconds during the work; merge left to user.

## Ask
User retest (2026-10-06) found /settings/discussion, /settings/media, /seo/titles-meta, /seo/sitemap, /seo/redirections, /seo/404-monitor only partially fixed. Later priority (via memory): login language-selector position STILL broken after 10:49 UTC AuthHeader push; fix button first, then login error.

## Changes (commit ed74abf)
- **Discussion**: added missing WP sections — Before a comment appears (manual approval, prev-approved author), Comment Moderation (link-count + moderation keys textarea), Disallowed Comment Keys textarea, Avatars (show, max rating G/PG/R/X, default avatar 7 options). Fixed hardcoded "days". 26 new settings i18n keys × 4 locales.
- **Media**: verified complete; benefits from new form-table CSS.
- **Titles & Meta**: full Rank Math-style rework — Global (separator, variable reference), Homepage/Posts/Pages/Categories/Tags/Author/Misc sections, title+description templates, robots per type, click-to-insert variable chips. Full i18n.
- **Sitemap**: rework — enable toggle, sitemap URL with copy/view, links-per-sitemap, include images, post-type + taxonomy toggles, exclude IDs.
- **Redirections**: i18n, search, edit mode, pagination (20), bulk delete, active toggle, 410/451 codes, sorted by hits.
- **404 Monitor**: proper design — stat cards (URLs, total hits, today, top URL), search, 4 sort orders, pagination, bulk delete, first-seen column, exclude-paths settings card.
- **actions/seo-tools**: `updateRedirectionAction`, `bulkDeleteRedirectionsAction`, `bulkDeleteNotFoundLogsAction`; `listNotFoundLogsAction` honors `seo.notFoundExclude`.
- **packages/seo**: `logNotFound` accepts `exclude` patterns; `listNotFoundLogs` returns `firstSeen`.
- **CSS**: added missing `.v-form-table` (WP 2-col label/field, stacks ≤782px) and `.v-screen-reader-text`; settings-form now uses `v-alert` (`v-notice` never existed in CSS).
- **Locales**: 110 new seo keys × 4 locales (en/ur/ar/es), 26 settings keys × 4.
- Verified: tsc (no new errors; pre-existing auth.ts 2FA + packages/auth useNumberId remain), oxlint 0 warnings, `next build` passes.

## Changes (commit cca2ddf)
- **Login button fix**: `.v-login-header-row` was flex + absolutely-positioned selector → selector overlapped centered "VARKA" brand on narrow cards (user screenshot). Replaced with 3-col grid (`1fr auto 1fr`): brand truly centered in col 2, selector pinned in col 3, no overlap possible. RTL-safe (grid auto-flips).

## Not done
- **Login Int/String error** (screenshot: `db[model].findMany()` where userid "1" — expected Int, got String): left alone — user is mid-migration on numeric user IDs ("Better Auth serial IDs" pushes); touching it would collide.
- **Merge to main**: user's call (main was hot).
- Vercel deploy of 5ff936d still blocked until ~2026-10-07 00:20 PDT (100 deploys/day limit).

## Gotchas for next time
- Local `main` has diverged badly from `origin/main` (87 local vs 322 remote commits, duplicated history, an ambiguous local branch literally named `origin/main`). Don't push local main; cherry-pick or branch from `refs/remotes/origin/main`.
- `git stash pop` across divergent branches uses the ancient merge-base → spurious conflicts. Prefer `git checkout stash@{0} -- <files>` for wholesale file takes.
- GitHub PAT surrogate does NOT work in git-https URLs; use the Git Data API (see /tmp/push-branch.py pattern) or contents API.
- Voice notes: `~/workspace/.whisper-env` (faster-whisper, 459MB) transcribes them; needs `unset no_proxy` (httpx chokes on `[::1]` entries) and an `av.open` monkeypatch for `metadata_errors` kwarg. Both user voice notes 2026-10-06 were unintelligible (possible background/child audio).
- Dangling commit 3550c1e (2026-10-06 03:56) holds auth-header/wp-login-media/packages-auth changes from a parallel session — don't lose it.

## Skills used
- `.claude/skills/wp-admin-dashboard/SKILL.md` + `references/settings-pages.md`
