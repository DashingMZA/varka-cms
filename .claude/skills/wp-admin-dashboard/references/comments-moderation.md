# Comments & Moderation

## Queue
- `list-table-pattern.md` with status tabs: `All | Pending | Approved | Spam | Trash`,
  sidebar badge shows the Pending count.
- Columns: author (avatar/name/email/IP), comment excerpt (expandable), in-response-to
  (post link), submitted date.
- Row actions: **Approve/Unapprove**, **Reply** (inline textarea, posts as the current
  admin), **Quick Edit**, **Spam**, **Trash**, **Delete Permanently**.
- Bulk actions mirror the row actions.

## Threading
- Nested replies up to a configurable max depth (Settings → Discussion), each level
  visually indented; pagination breaks on top-level comments, not individual replies.

## Anti-spam / abuse prevention
- Honeypot hidden field + submission-timing check on the public comment form.
- Rate limit comment submissions per IP/session (see `security.md`).
- Keyword/domain blocklist — auto-spam or auto-trash matches (mirrors WP's "Disallowed
  Comment Keys").
- Require moderation for a commenter's **first** approved-less comment; auto-approve
  subsequent ones from a previously-approved email (configurable in Settings →
  Discussion).
- Optional pluggable spam-filter integration point (Akismet-style third-party API hook).

## Notifications
- Configurable: email the admin/author on new comment, on a comment held for moderation,
  or neither — matches WP's Discussion settings toggles.
