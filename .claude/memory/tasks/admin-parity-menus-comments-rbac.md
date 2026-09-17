# admin-parity-menus-comments-rbac

- **Date:** 2026-09-18
- **Asked:** Menus/widgets DnD persistence; comments bulk+reply; roles matrix; requirePermission; page editor; English response.

## Built

- Menu builder HTML5 DnD + PUT /api/menus (SiteSetting appearance.menus)
- Widgets zones DnD + PUT /api/widgets (SiteSetting appearance.widgets)
- Comments: ListTable, bulk API, inline reply, guard() auth
- Roles capability matrix /users/roles
- lib/api-guard.ts + posts/media/comments using requirePermission
- Page editor /content/pages/[id]

## Follow-ups

- Guard remaining mutation routes
- Tiptap on page editor
- Nested menu indent
- Live DB role-permission editor
