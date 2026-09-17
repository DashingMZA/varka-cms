# Users, Roles & Permissions

## Roles (default set — rename to fit the project, keep the hierarchy)
| Role | Typical capabilities |
|---|---|
| Administrator | Everything: manage_users, manage_options (settings), edit_others_posts, publish_posts, delete_any_post, manage_categories, moderate_comments, upload_files, view_audit_log |
| Editor | edit_others_posts, publish_posts, delete_posts, moderate_comments, manage_categories, upload_files — no user/settings management |
| Author | edit_own_posts, publish_posts, delete_own_posts, upload_files |
| Contributor | edit_own_posts (draft only), no publish, no upload_files |
| Subscriber | read-only profile access, no admin screens |

Store roles as a table with a capability list (or a role→capabilities join table) rather
than hardcoding checks by role name, so custom roles can be added later.

## Users list
- Standard `list-table-pattern.md` with a **Role** filter dropdown and bulk "Change role"
  action, plus columns: avatar, username, name, email, role, post count, registered date.

## Add / Invite user
- Two paths: (a) **Add New** — admin sets username/email/role and either sets a password
  directly or sends a "set your password" invite email with a time-limited signed link;
  (b) self-registration (if enabled in Settings → General) with default role applied.

## User profile screen (own profile + admin editing others)
- **Personal Options**: admin color scheme / theme (light/dark) picker, toolbar visibility,
  keyboard shortcuts toggle, language.
- **Name**: first/last/display name/nickname (pick how the display name is composed).
- **Contact Info**: email, website, social links.
- **About**: biographical info textarea, profile picture (upload or Gravatar-style
  hash-based fallback).
- **Account Management**: change password (with strength meter), **Sessions** — list of
  active sessions (device/IP/last-active) with a "Log out everywhere else" action,
  **Application Passwords / API tokens** — create/revoke scoped tokens for external
  integrations, each with a name, created date, last-used date.
- **Two-Factor Authentication**: enable/disable TOTP (QR code enrollment), view/regenerate
  backup codes.
- Admins editing another user additionally see: role selector, "Send password reset",
  "Delete user" (with a reassign-content-to picker, mirroring WP's delete-user flow).

## Enforcement
- Every capability check happens **server-side** in the Server Action/Route Handler, not
  just hidden UI — the UI hiding is a courtesy, not the security boundary
  (see `security.md`).
