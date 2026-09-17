---
name: wp-admin-dashboard
description: >
  Build or extend a WordPress-admin-parity CMS admin dashboard inside a Next.js project —
  full navigation/IA, dashboard widgets, list-table (posts/pages/media/users/comments) CRUD
  screens, content editor, media library, roles and permissions, appearance/customizer,
  settings pages, design system (colors/typography/layout), and security hardening. ALWAYS
  consult this skill whenever the user asks to build, redesign, add a feature to, or fix
  anything in "the admin dashboard", "admin panel", or "backend/dashboard for my
  Next.js/CMS project", even if they don't say "WordPress" — this project's target UX is
  explicitly modeled on WordPress wp-admin. Do not skip modules; the user wants 100%
  feature parity, not a partial clone.
---

# WordPress-Admin-Parity Dashboard for Next.js

This skill packages a full functional + visual spec of the WordPress `wp-admin` panel,
translated into a buildable plan for a Next.js app. The goal is **feature parity**, not a
literal PHP port: every WP admin capability gets a Next.js-native equivalent (Server
Actions/Route Handlers, a real DB via Prisma, React components, RBAC middleware, etc.).

The two reference screenshots this skill was built from show a real wp-admin dashboard
("Site Health", "At a Glance", "Quick Draft", "WordPress Events and News" widgets, sidebar
with Dashboard/Posts/Media/Comments/Appearance/Users/Languages/SEO/Tools/Settings) and a
minimal custom Next.js admin ("Dashboard", "Media" only) — the gap between them is what
this skill closes.

## How to use this skill

1. **Always start from `references/navigation-ia.md`** to scaffold (or audit) the sidebar,
   top admin bar, and route structure before building individual screens.
2. For each screen/module the user asks about, open the matching reference file below —
   don't guess from memory, the files contain the exact field lists, states, and edge cases.
3. Every CRUD screen (Posts, Pages, Media, Users, Comments) reuses the **one** pattern in
   `references/list-table-pattern.md`. Build it once as a generic component, don't
   reimplement per-entity.
4. Apply `references/design-system.md` tokens (colors/spacing/typography/components) to
   everything you build — don't invent ad hoc styling per screen.
5. Apply `references/security.md` to every mutation you write — RBAC check, input
   validation, CSRF protection, and audit logging are not optional add-ons, they're part of
   "the feature" per the user's "100% functions/features + security" requirement.
6. Use `references/data-model-nextjs.md` as the default Prisma schema / API shape unless
   the user's project already has an existing schema — then map fields onto it instead of
   replacing it.

## Reference files (load the ones relevant to the current task)

| File | Covers |
|---|---|
| `references/navigation-ia.md` | Sidebar menu tree, top admin bar, breadcrumbs, quick-add, global search, badges/counts, collapse behavior |
| `references/dashboard-widgets.md` | Home dashboard: At a Glance, Activity, Quick Draft, Site Health, News/Updates widget, drag-to-reorder, Screen Options |
| `references/list-table-pattern.md` | The reusable data-table pattern used by every list screen: filters, bulk actions, search, sorting, pagination, quick edit, trash |
| `references/content-editor.md` | Post/Page editor: title, slug, rich content, publish box, categories/tags, featured image, revisions, autosave, SEO panel |
| `references/media-library.md` | Upload, grid/list view, image editor, attachment details, insert-into-content flow |
| `references/users-roles.md` | Roles & capability matrix, user list, add/invite user, profile screen, sessions, application tokens |
| `references/comments-moderation.md` | Moderation queue, statuses, threading, anti-spam, notifications |
| `references/appearance-customization.md` | Live customizer, menus builder, widget areas, site identity/logo/favicon |
| `references/settings-pages.md` | General/Writing/Reading/Discussion/Media/Permalinks/Privacy settings screens |
| `references/design-system.md` | Full color palette, typography, spacing, layout grid, component states, responsive breakpoints, accessibility |
| `references/security.md` | AuthN/AuthZ, CSRF, input sanitization, upload validation, rate limiting, sessions, audit log, headers, backups, Site-Health-style checks |
| `references/data-model-nextjs.md` | Suggested Prisma schema, API/route layout, storage, search, caching/ISR |

## Build order (recommended, skip nothing)

1. Data model (`data-model-nextjs.md`) → 2. Auth + RBAC (`security.md`) → 3. Shell/nav
(`navigation-ia.md` + `design-system.md`) → 4. Dashboard home (`dashboard-widgets.md`) →
5. Generic list-table component (`list-table-pattern.md`) → 6. Posts/Pages editor
(`content-editor.md`) → 7. Media library (`media-library.md`) → 8. Users & roles
(`users-roles.md`) → 9. Comments (`comments-moderation.md`) → 10. Appearance
(`appearance-customization.md`) → 11. Settings (`settings-pages.md`) → 12. Harden
everything against the `security.md` checklist and add the Site-Health-style diagnostics
panel.

## Non-goals / adaptation notes

- Don't literally port PHP files from a wp-admin core dump — that's WordPress's own GPL
  codebase, not a spec to copy line-for-line; use it only as the UX/feature reference it's
  being used for here.
- "Plugins" has no direct Next.js equivalent — map it to an **Integrations** screen
  (webhooks, API keys, connected services) unless the project genuinely needs a plugin
  runtime.
- Where WP relies on PHP/MySQL specifics (nonces, wp_options, admin-ajax.php), the reference
  files already give you the Next.js-native equivalent — use those, not the PHP mechanism.
