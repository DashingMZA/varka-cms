# Design System

## Color palette (default "wp-admin blue" scheme — ship as CSS variables)
| Token | Hex | Use |
|---|---|---|
| `--sidebar-bg` | `#1d2327` | sidebar & top admin bar background |
| `--sidebar-bg-hover` | `#2c3338` | sidebar item hover |
| `--sidebar-text` | `#f0f0f1` | sidebar/top-bar text |
| `--sidebar-text-muted` | `#a7aaad` | secondary sidebar text/icons |
| `--accent` | `#2271b1` | links, primary actions, active nav item |
| `--accent-hover` | `#135e96` | primary button/link hover |
| `--success` | `#00a32a` | success banners, "Good" health status |
| `--warning` | `#dba617` | warning banners, "Should be improved" |
| `--danger` | `#d63638` | error banners, destructive actions, "Critical" |
| `--bg` | `#f0f0f1` | page/canvas background |
| `--surface` | `#ffffff` | cards, panels, tables |
| `--border` | `#c3c4c7` | borders, dividers |
| `--text` | `#1d2327` | headings, primary text |
| `--text-secondary` | `#646970` | secondary/meta text |

Also offer alternate **admin color schemes** (Light, Midnight/dark, Ocean, Coffee) as
selectable presets in the user profile (`users-roles.md`), stored per-user, and a
first-class **dark mode** (not stock in WP, but expected in a modern app) driven by the
same CSS variables.

## Typography
- Font stack: system UI stack (`-apple-system, "Segoe UI", Roboto, Helvetica, Arial,
  sans-serif`) for chrome; a distinct stack allowed for the public site's typography.
- Base body 13–14px, line-height 1.4–1.5. Heading scale: H1 23px/600, H2 20px/600,
  H3 16px/600, small/meta text 12px.
- Monospace (`ui-monospace, SFMono-Regular, Menlo, monospace`) for code blocks, slugs,
  and the permalink preview.

## Spacing & layout
- 4px base spacing unit; common steps 4/8/12/16/20/24/32/40px.
- Top admin bar: 32px height, fixed, `z-index` above sidebar and content.
- Sidebar: 160px expanded, 36px icon-only collapsed, fixed height 100vh, independently
  scrollable from content.
- Content area: `max-width` ~1280px with responsive gutters (16–24px), 12-column grid for
  multi-panel screens (e.g. editor content 8-col + sidebar meta boxes 4-col).
- Cards/meta-boxes: `--surface` background, 1px `--border`, 2–4px border-radius, subtle
  `box-shadow: 0 1px 1px rgba(0,0,0,.04)`, header row with drag handle + collapse chevron.

## Iconography
- Use a consistent icon set (lucide-react or heroicons) as the Dashicons equivalent, 20px
  in the sidebar, 16px inline, always paired with an `aria-label` when icon-only.

## Components & states
- **Buttons**: primary (filled `--accent`), secondary (outlined), link-style (text only),
  destructive (filled `--danger`) — each with hover/active/disabled/loading (spinner)
  states.
- **Form fields**: text/select/checkbox/radio/toggle/date-picker with a visible focus ring
  (`--accent` outline), inline validation error text in `--danger` below the field.
- **Admin notices**: dismissible banners in success/warning/error/info variants, colored
  left border + tinted background, appear at the top of the content area after an action.
- **Toasts**: transient bottom-right/top-right confirmations for async actions
  (save/delete/publish) — don't rely on full-page reloads to show feedback anywhere in the
  app (replace every stock "Loading…" text state — as seen in the current dashboard
  screenshot — with a proper skeleton loader).
- **Modals**: confirm-destructive-action modal (delete, empty trash), media-picker modal,
  always trap focus and close on Escape/overlay click.
- **Tabs, badges/count pills, breadcrumbs, tooltips**: consistent styling shared via the
  design system, not redefined per screen.

## Responsive breakpoints
- `<600px`: sidebar becomes a bottom sheet or hamburger drawer; stack all multi-column
  screens.
- `600–782px`: list-tables collapse to stacked cards (per `list-table-pattern.md`).
- `782–960px`: sidebar auto-collapses to icon-only by default.
- `960px+`: full desktop layout as described above.

## Accessibility
- WCAG AA contrast minimum on all text/background pairs above.
- Every icon-only control has an `aria-label`; every form field has an associated
  `<label>`; visible focus outlines everywhere (never `outline: none` without a
  replacement).
- Full keyboard navigation: sidebar, tables (arrow/tab), modals (focus trap), command
  palette.
- "Skip to content" link as the first focusable element on every admin page.
