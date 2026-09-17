# Users & Roles

## List table
- Columns: username/display name, email, role(s), posts count, status.
- Filters by role; search; bulk promote/demote/delete (never delete last owner).

## Add User
- Email, username, name fields, role select, password generator + strength meter.
- Send reset/invite email optional.

## Profile
- Personal options including **admin color scheme** (per-user dashboard theme).
- Bio, website, avatar/Gravatar placeholder.
- Change password (current + new) with policy enforcement.

## Roles (RBAC)
- Seeded: Owner, Admin, Editor, Author, Contributor, Reader (map to permission catalog).
- Permission checks on every mutation via `requirePermission` / middleware.

## VARKA
- API: `/api/users`, `/api/users/[id]`, `/api/users/me`
- UI: `users-admin`, `user-new-form`, `user-profile-form`
- Package: `packages/auth`, `packages/permissions`
