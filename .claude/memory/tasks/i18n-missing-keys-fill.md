# i18n-missing-keys-fill — 2026-10-06

## Ask
Fill missing i18n translation keys from `.claude/memory/tasks/i18n-missing-keys.json`
(namespaces → locales → {key, en_fallback}) across `packages/i18n/locales/{en,ar,es,ur}/`.

## Changes (locale JSON files only — no code touched)
- Added **408 keys total** across 36 files (9 namespaces × 4 locales; created 4 new files:
  `es/auth.json`, `ar/errors.json`, `es/errors.json`, `ur/errors.json`).
- Per namespace/locale additions:
  - auth: en 1, ar 27, es 53, ur 27
  - blogs: en 8, ar 8, es 9, ur 8
  - comments: 1 × 4
  - common: 2 × 4
  - dashboard: en 9, ar 9, es 16, ur 9
  - errors: 3 × 4
  - forms: 29 × 4
  - media: 19 × 4
  - pages: 2 × 4
- en values: used `en_fallback` when present; derived from call sites when null:
  - `auth.invalidOtp` = "Invalid code. Please try again." (login-form.tsx:132, 2FA verify failure)
  - `common.and` = "and" (register-form.tsx:201, between Terms/Privacy links)
  - `errors.loadFailed` = "Failed to load.", `errors.saveFailed` = "Failed to save."
  - Note: `errors.networkError` en_fallback was "Upload failed" — kept verbatim per instruction, though call sites
    (comments-moderation.tsx:55, pages-admin.tsx:67, posts-admin.tsx:114) are generic error fallbacks, not uploads.
    Worth a follow-up review.
- ar/es/ur: hand translations matching tone of existing keys in each file (2-space indent preserved,
  new keys appended at end, existing keys untouched).

## Verification
- Re-scan of every key in `i18n-missing-keys.json`: all 408 present, none missing, no empty values.
- All 36 files parse as valid JSON.
- Script: `/tmp/fill_i18n.py` (throwaway).

## Skills used
- None (mechanical i18n fill; call-site greps in apps/admin/src for derived English labels).

## Follow-ups
- Review `errors.networkError` English value ("Upload failed" used as generic error text).
- Review `dashboard.quickDraftContent` es value (scan's en_fallback was truncated "What"; used real en
  "What's on your mind?" → "¿Qué tienes en mente?").
- Re-run full i18n parity scan to confirm no other missing keys remain.
