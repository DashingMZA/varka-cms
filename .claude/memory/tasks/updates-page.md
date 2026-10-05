# Updates Page (WordPress-style)

**Date:** 2026-10-05
**Ask:** User requested `/updates/` page like WordPress — show available updates for packages/admin/web, click to update.

## Changes

- `apps/admin/src/actions/updates.ts` — `checkUpdatesAction()` checks npm registry for latest versions of @varka/* packages and major deps; `getAppVersionAction()` returns app version + git commit.
- `apps/admin/src/components/updates-page.tsx` — Updates UI with app version panel and package updates tables (VARKA packages vs dependencies separated).
- `apps/admin/src/app/(dashboard)/dashboard/updates/page.tsx` — Route.
- `apps/admin/src/components/admin-nav.tsx` — Dashboard now has submenu: Home, Updates.
- i18n: `dashboard.json` + `nav.json` keys in en/ar/es/ur.

## Skills used

- `.claude/skills/wp-admin-dashboard/SKILL.md` (navigation IA pattern)

## Notes

- Updates are deployed via git push (Vercel auto-deploys); the page shows `pnpm update` command for package updates.
- npm registry check caches for 1 hour via `next.revalidate`.

## Follow-ups

- Could add one-click update via server action in dev environments (risky in production).
- Could check git remote for new commits.
