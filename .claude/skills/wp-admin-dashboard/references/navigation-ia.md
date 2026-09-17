# Navigation & Information Architecture

## Top admin bar (fixed, height ~32px, dark #1d2327)
- Left: site logo/icon (links to dashboard), site name, "New" dropdown (+ New Post, + New
  Page, + New Media, + New User — filtered by what the current user's role can create).
- Center/left: global search trigger (Cmd/Ctrl+K command palette — search posts, pages,
  users, settings by name).
- Right: notifications bell (unread count badge), comments icon (pending-moderation count
  badge), "Howdy, {user name}" with avatar → dropdown (Edit Profile, My Sessions, Log Out).
- Bar is sticky on scroll, same on every authenticated screen.

## Left sidebar (fixed, dark #1d2327, ~160px expanded / ~36px icon-only collapsed)
Top-level items, each with an icon and optional flyout/accordion submenu. Highlight the
active item and its parent. Badge counts render as small pill on the right of the label
(e.g. Comments "430").

1. **Dashboard** — Home, Updates
2. **Posts** — All Posts, Add New, Categories, Tags
3. **Media** — Library, Add New
4. **Pages** — All Pages, Add New
5. **Comments** (badge = pending count)
6. **Appearance** — Themes, Customize, Widgets, Menus, Site Editor
7. **Users** — All Users, Add New, Profile (own), Roles
8. **Integrations** *(WP's "Plugins" equivalent)* — Installed, Add New, API Keys/Webhooks
9. **Tools** — Import, Export, Site Health, Audit Log
10. **Settings** — General, Writing, Reading, Discussion, Media, Permalinks, Privacy
11. Optional project-specific items (e.g. "SEO", "Languages") appended below Settings,
    same visual treatment.

Bottom of sidebar: "Collapse menu" toggle (persists per-user, localStorage + DB), and (in
collapsed state) a condensed user avatar/logout affordance.

Submenus expand on hover when the sidebar is icon-only-collapsed, and as an inline
accordion when expanded. Only show submenu items the user's role can access — hide
(not just disable) items the current role has zero capability for.

## Route structure (Next.js App Router)
```
/admin
  /admin (dashboard home)
  /admin/posts            (list-table)
  /admin/posts/new
  /admin/posts/[id]
  /admin/pages            (list-table)
  /admin/pages/new
  /admin/pages/[id]
  /admin/media            (library grid/list)
  /admin/comments         (moderation queue)
  /admin/appearance/themes
  /admin/appearance/customize
  /admin/appearance/menus
  /admin/appearance/widgets
  /admin/users            (list-table)
  /admin/users/new
  /admin/users/[id]
  /admin/users/profile    (self)
  /admin/integrations
  /admin/tools/import
  /admin/tools/export
  /admin/tools/site-health
  /admin/tools/audit-log
  /admin/settings/general
  /admin/settings/writing
  /admin/settings/reading
  /admin/settings/discussion
  /admin/settings/media
  /admin/settings/permalinks
  /admin/settings/privacy
```
Wrap `/admin/**` in a layout that: verifies session, loads current user + role +
capabilities, renders top bar + sidebar, and redirects unauthenticated users to a login
screen (never render sidebar labels for modules the role can't reach).

## Breadcrumbs & page headers
Every screen: `H1` page title + optional "Add New" button top-right, and for
edit/detail screens a breadcrumb (`Posts > Edit "My Post Title"`). Screen-level
contextual actions (Screen Options, Help) live top-right, matching WP's pattern.
