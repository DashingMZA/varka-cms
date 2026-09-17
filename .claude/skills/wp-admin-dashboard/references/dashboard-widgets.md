# Dashboard Home Widgets

Layout: responsive 2–3 column masonry grid of collapsible "card" widgets. Each widget has
a header (drag handle + title + collapse chevron) and a body. Widget order and
collapsed/visible state persist **per user** (DB, not just localStorage).

## At a Glance
- Counts with icons, each linking to the filtered list: Published posts, Pages, Draft
  posts, Comments (total / in moderation), Media items.
- One line of system info: app version, active theme/template name.
- Loading state: skeleton placeholders (never a bare "Loading…" text).

## Activity
- "Recently Published" — last N posts/pages with title (link), type badge, relative time.
- "Recent Comments" — avatar, author name + email, excerpt of comment, target post link,
  inline row actions: Approve, Reply, Edit, Spam, Trash.

## Quick Draft
- Minimal form: Title input, Content textarea, "Save Draft" primary button. Creates
  `status=draft` post, success toast, clears form — no redirect.

## Site Health Status
- Circular score/ring (Good / Should be improved / Critical) + link to diagnostics
  (see `security.md`).

## Screen Options panel
- Top-right "Screen Options" with checkboxes to show/hide each widget; persist to user prefs.

## Empty/first-run state
- Welcome panel with setup checklist when zero content exists.
