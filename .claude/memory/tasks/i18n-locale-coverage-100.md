# i18n: 100% locale key coverage (nav/dashboard/blogs/comments/forms)

**Date:** 2026-10-04

## Ask
Fill missing i18n locale keys so en/ar/es/ur have full coverage for 5 namespaces: nav, dashboard, blogs, comments, forms.

## Changes
- Added 239 keys total across ar/es/ur:
  - `nav`: ar +8 (settings subpages), es/ur +30 each (all main nav labels)
  - `dashboard`: es/ur +12 each (At a Glance, Activity, Quick Draft, Site Health widgets + health states); ar kept its 2 extra keys
  - `blogs`: ar/es/ur +22 each (editor toolbar/dialog keys: addTitle, addMedia, writeContent, saveDraft, autosaved, etc.)
  - `comments`: created ar/es/ur with all 18 keys
  - `forms`: created ar/es/ur with all 9 keys
- Files reordered to match English key order (locale-only extras appended at end).
- Professional admin-UI translations (not literal): e.g. nav.posts → ar "المقالات", es "Entradas", ur "پوسٹس".

## Verification
- Key-parity script: every en key present in ar/es/ur for all 5 namespaces ✅
- Final counts: nav 34/34/34/34, dashboard 27/29/27/27, blogs 65/65/65/65, comments 18/18/18/18, forms 9/9/9/9
- Pushed as `2eafa73` ("feat(i18n): 100% locale coverage for nav/dashboard/blogs/comments/forms")

## Skills used
- None beyond repo AGENTS.md conventions.

## Follow-ups
- `dashboard.json` ar has 2 extra keys (expandMenu/collapseMenu leaking from nav) — harmless, could be removed later.
