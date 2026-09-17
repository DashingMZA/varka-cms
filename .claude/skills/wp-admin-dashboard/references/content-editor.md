# Post / Page Editor

## Main column
- Title field, large placeholder "Add title" — auto-generates a URL slug on first save
  (editable permalink preview beneath the title: `yoursite.com/…/[slug]` with an "Edit"
  pencil that turns it into an inline input).
- Content area: rich block/WYSIWYG editor (headings, lists, images, embeds, code blocks,
  quotes) with drag-to-reorder blocks, or a Markdown+preview split if the project prefers
  that — either way support paste-from-Word/Google-Docs cleanup.
- Autosave every ~15–60s to a `revisions` table (don't overwrite the published/live
  version); "Revisions" link shows a timeline with diff view and one-click restore.
- Word count + estimated reading time in the editor footer.

## Publish box (sticky right sidebar, top)
- **Status**: Draft / Pending Review / Published / Scheduled / Private.
- **Visibility**: Public / Password Protected (+ password field) / Private.
- **Publish date**: "Publish immediately" link → inline date/time picker for scheduling
  (future date = auto-publish via scheduled job).
- Buttons: **Save Draft**, **Preview** (opens unpublished view in new tab via a signed
  preview link), **Publish** (or **Update** once published), and below the box a
  **Move to Trash** link.

## Side meta boxes (collapsible, reorderable)
- **Categories**: checkbox tree (hierarchical), "+ Add new category" inline.
- **Tags**: comma-style input with autocomplete + create-on-the-fly.
- **Featured Image**: "Set featured image" opens the Media Library modal
  (`references/media-library.md`); shows thumbnail + "Remove" once set.
- **Excerpt**: short plain-text summary field.
- **SEO** (if project needs it): meta title, meta description, canonical URL, and a
  live Google-style SERP preview + social (OpenGraph) preview card.
- **Discussion**: toggles for "Allow comments" / "Allow pingbacks/trackbacks".
- **Author**: reassign author (admin/editor only).
- **Page Attributes** (Pages only): Parent page dropdown, menu order, page template
  selector.

## Comments panel
- Below the editor on the edit screen: list of comments on this post with the same
  inline moderation actions as the dashboard Activity widget.

## Validation & guardrails
- Block publish with inline errors if required fields are missing (title, or slug
  collision) — never a silent failure.
- Warn on navigating away with unsaved changes (`beforeunload` + in-app route guard).
- Concurrent-edit lock/notice ("This post is currently being edited by X") to prevent
  two users overwriting each other, mirroring WP's post-locking.
