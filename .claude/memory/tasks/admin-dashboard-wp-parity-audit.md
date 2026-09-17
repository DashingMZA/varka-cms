# admin-dashboard-wp-parity-audit

- **Date:** 2026-09-18
- **Asked:** Audit admin against `wp-admin-dashboard` skill; gap list; implement missing; task memory.

## Gap summary (before this turn)

| Module | Status |
|--------|--------|
| Navigation / shell | Partial — WP-style nav + fold; missing Categories/Tags/Privacy/Appearance children |
| Dashboard widgets | Partial — At a Glance, Activity, Quick Draft; limited Screen Options |
| Posts list + editor | Strong — list table, Tiptap, meta boxes, featured image, revisions |
| Pages list | Partial — list exists; editor thinner than posts |
| Media library | Strong — grid, upload, insert modal, derivatives |
| Comments | Partial — moderation queue; limited threading/reply UX |
| Users & roles | Partial — list, add, profile + color schemes; no capability matrix UI |
| Appearance | Weak — theme picker only → Themes/Menus/Widgets structure added |
| Settings | Strong — 6 groups; Privacy missing → added |
| Design system | Partial — `--wp-*` tokens; inconsistent application |
| Security | Partial — headers, audit, login rate-limit; not every route has RBAC |
| Data model | Strong — Prisma covers core entities |

## Built this turn

- Shared list-table primitives
- Settings Privacy page + API group privacy
- Appearance hub + Themes/Menus/Widgets routes
- Categories + Tags admin + APIs
- Nav updates

## Follow-ups

- Refactor all lists to shared ListTable
- Menus/widgets persistence
- Page editor parity
- RBAC on every mutation
- Comment bulk + reply
