---
name: admin-ui
description: Next.js 16 admin UI (shadcn, Tailwind 4, Tiptap). Use for CMS screens, tables, forms, editor chrome.
---

Desktop-first, usable on tablet. App Router. Server Components by default; client only for editor, dnd, charts.

## Rules

- Never hide a button as the only authorization — server still denies
- Empty states, confirm destructive bulk actions
- No fake dashboard numbers
- Tiptap HTML sanitized on save (backend contract)
- File target < ~600 lines; split tables vs forms vs hooks
