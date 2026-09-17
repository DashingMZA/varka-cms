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

## How to use this skill

1. **Always start from `references/navigation-ia.md`** to scaffold (or audit) the sidebar,
   top admin bar, and route structure before building individual screens.
2. For each screen/module the user asks about, open the matching reference file below —
   don't guess from memory; the files contain field lists, states, and edge cases.
3. Every CRUD screen (Posts, Pages, Media, Users, Comments) reuses the **one** pattern in
   `references/list-table-pattern.md`. Build it once as a generic component.
4. Apply `references/design-system.md` tokens to everything — no ad hoc styling per screen.
5. Apply `references/security.md` to every mutation — RBAC, validation, CSRF, audit log.

## Reference map

| Topic | File |
|-------|------|
| Navigation / IA | `references/navigation-ia.md` |
| Dashboard widgets | `references/dashboard-widgets.md` |
| List tables | `references/list-table-pattern.md` |
| Content editor | `references/content-editor.md` |
| Media library | `references/media-library.md` |
| Users & roles | `references/users-roles.md` |
| Comments | `references/comments-moderation.md` |
| Appearance | `references/appearance-customization.md` |
| Settings | `references/settings-pages.md` |
| Design system | `references/design-system.md` |
| Security | `references/security.md` |
| Prisma data model | `references/data-model-nextjs.md` |

## Project context (VARKA)

- Admin app: `apps/admin` (Next.js 16 App Router)
- DB: `packages/database` (Prisma)
- Auth/RBAC: `packages/auth`, `packages/permissions`
- Media: `packages/media`
- CSS tokens: `apps/admin/src/app/globals.css` (`--wp-*` variables)

See root `CLAUDE.md` and `AGENTS.md` for stack lock and memory rules.
