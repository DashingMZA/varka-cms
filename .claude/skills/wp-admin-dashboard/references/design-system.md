# Design System

Align with WordPress wp-admin visual language. VARKA CSS tokens live in
`apps/admin/src/app/globals.css` as `--wp-*` variables.

## Core tokens

| Token | Default |
|-------|--------|
| Sidebar | `#1d2327` |
| Sidebar hover | `#2c3338` |
| Current/accent | `#2271b1` |
| Content bg | `#f0f0f1` |
| Border | `#c3c4c7` |
| Ink | `#1d2327` |
| Muted | `#646970` |
| Danger | `#d63638` |
| Success | `#00a32a` |
| Sidebar width | `160px` (folded `36px`) |
| Top bar height | `32px` |
| Radius | `3px` |
| Font | system UI stack (WP-like) |

## Admin color schemes

Per-user `adminColorScheme`: default, light, blue, coffee, ectoplasm, midnight, ocean, sunrise — applied via `data-admin-scheme` on `<html>`.

## Components

- Buttons: `.v-btn`, `.v-btn--primary`, `.v-btn--danger`, `.v-btn--success`
- Panels / meta boxes: `.v-panel`, `.v-metabox`
- Tables: `.v-table`, `.v-table-wrap`, row-actions on hover
- Notices: `.v-alert`, `.v-alert--error`, `.v-alert--ok`
- Screen Options / Help: `.v-screen-meta`
- Media modal: `.v-media-modal`

## Layout

- Grid shell: `.v-admin` → topbar + sidebar + main
- Editor: `.v-editor` main + sidebar meta columns
- Mobile: collapse sidebar below 782px

## Rules

- Prefer existing classes over one-off inline styles for new screens
- Match WP density (13px base, compact controls)
- Do not copy WordPress PHP/CSS files verbatim (copyright); use tokens + original React UI
