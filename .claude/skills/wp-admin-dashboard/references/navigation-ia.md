# Navigation & information architecture

## Shell

- Top bar (~32px): site name / View Site / user menu
- Left sidebar (160px expanded, 36px folded): primary nav + submenus
- Collapse control persists (localStorage)

## Primary menu order (target)

1. Dashboard
2. Posts (All Posts, Add New, Categories, Tags) — Pages may nest under Posts or standalone
3. Media
4. Comments
5. Appearance
6. Users (All Users, Add User, Profile)
7. Tools / System
8. Settings (General, Writing, Reading, Discussion, Media, Permalinks)

Plus VARKA-specific: Languages, SEO (do not duplicate Settings/Tools icons).

## Rules

- One expandable submenu per parent — no duplicate top-level entries
- Active state: left border / current class on leaf routes
- Folded mode shows icons only; flyout optional later

## Routes (admin)

- `/dashboard`, `/content/posts`, `/content/pages`, `/media`, `/comments`
- `/users`, `/users/new`, `/users/profile`
- `/settings/{general,writing,reading,discussion,media,permalinks}`
- `/appearance`, `/seo`, `/languages`, `/system`
