# Dashboard Home Widgets

Layout: responsive 2–3 column masonry grid of collapsible "card" widgets. Each widget has
a header (drag handle + title + collapse chevron) and a body. Widget order and
collapsed/visible state persist **per user** (DB, not just localStorage).

## At a Glance
- Counts with icons, each linking to the filtered list: Published posts, Pages, Draft
  posts, Comments (total / in moderation), Media items.
- One line of system info: app version, active theme/template name.
- Loading state: skeleton placeholders (never a bare "Loading…" text — replace the
  screenshot's raw loading text with skeleton bars/shimmer).

## Activity
- "Recently Published" — last N posts/pages with title (link), type badge, relative time.
- "Recent Comments" — avatar, author name + email, excerpt of comment, target post link,
  inline row actions: Approve, Reply, Edit, Spam, Trash (no full page reload — optimistic
  UI + server action).

## Quick Draft
- Minimal form: Title input, Content textarea ("What's on your mind?" placeholder), "Save
  Draft" primary button. Submits via a server action, creates a `status=draft` post, shows
  a success toast, clears the form. No redirect — stays on dashboard.

## Site Health Status
- Circular score/ring (Good / Should be improved / Critical) with color coding (green /
  amber / red) + one-line summary + link to the full diagnostics screen
  (`references/security.md` → Site-Health-style checks section defines what it checks).

## Product Updates / News (optional)
- Replace WP's external "WordPress Events and News" feed with an internal "What's new" /
  changelog feed, or omit entirely for an internal tool — don't wire up a random RSS feed
  by default.

## Screen Options panel
- A collapsible panel (top-right "Screen Options" button) with checkboxes to
  show/hide each dashboard widget and a "Layout columns" selector (1–4). Persist to the
  user's preferences.

## Empty/first-run state
- If the user has zero content, show a "Welcome" panel instead of empty widgets: short
  setup checklist (write your first post, upload a logo, invite a teammate) with direct
  links — mirrors WP's Welcome Panel.
