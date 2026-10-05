# i18n Batch 2: Widgets, Media Library, Dashboard

**Date:** 2026-10-05
**Ask:** Continue i18n conversion (batch 2) — users, comments, media, dashboard, widgets, menus components

## Changes

### Fully converted
1. **widgets-admin.tsx** — was completely unconverted (0% i18n)
   - New `widgets` namespace in `packages/i18n/src/messages.ts` MESSAGE_NAMESPACES
   - Created `packages/i18n/locales/{en,ar,es,ur}/widgets.json` (12 keys each)
   - L() pattern with TYPE_KEYS mapping for widget type labels
   - Placeholder pattern: `{status}` with `.replace()` (matches plugins-admin precedent)

2. **media-library.tsx** — SIZE_LABELS hardcoded English → i18n
   - Changed to SIZE_KEYS with i18nKey references
   - Added `thumbnail/medium/large/fullSize` to media.json (all 4 locales)

3. **dashboard-home.tsx** — ScreenMeta title + help text hardcoded → i18n
   - Added `title/overview/overviewBody/navigation/navigationBody` to dashboard.json
   - Created es/dashboard.json and ur/dashboard.json (were missing)

### Already converted (verified, skipped)
- users-admin.tsx — fully i18n (t() with fallbacks)
- comments-moderation.tsx — fully i18n (t() with fallbacks)
- menu-builder.tsx — clean, no hardcoded strings

## Verification
- `tsc --noEmit` in apps/admin: PASS (after clearing stale tsbuildinfo)
- `tsc --noEmit` in packages/i18n: PASS
- Pushed to origin/main as 616e24f via push_files API (16 files)

## Skills used
- `.claude/skills/wp-admin-dashboard/SKILL.md` (i18n patterns)

## Follow-ups
- users-admin.tsx and comments-moderation.tsx use direct `t()` with `||` fallback pattern (not L() helper) — both valid, no change needed
- Parent agent's parallel work (Forms module, schema.prisma changes) was in working tree but NOT committed by this task
