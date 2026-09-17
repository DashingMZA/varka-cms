# Settings Screens

Each is a simple form screen (label + control + help text per field) that writes to a
key-value `Setting` table (see `data-model-nextjs.md`), with a single **Save Changes**
button and a success toast/banner on save.

## General
- Site title, tagline, site URL, admin email (requires re-confirmation email on change),
  timezone, date format, time format, week starts on, default new-user role,
  "anyone can register" toggle.

## Writing
- Default post category, default post format (if applicable), default editor
  (block/markdown/classic), remote publishing / API posting toggle.

## Reading
- Homepage displays: "Your latest posts" or "A static page" (+ page pickers for home &
  posts page), posts-per-page for blog listing & feeds, RSS feed content (full text vs
  excerpt), "Discourage search engines from indexing this site" toggle (writes a
  `noindex` meta / robots rule).

## Discussion
- Default article settings: attempt to notify linked sites, allow link notifications from
  other sites, allow comments on new posts.
- Comment settings: require name+email, users must be registered to comment, close
  comments after N days, enable threaded replies (+ max depth), break comments into pages
  (+ per-page count and default page), comment moderation rules (hold if contains N+
  links, disallowed-keys list), avatar display + default avatar/rating.
- Email-me toggles: on new comment, on comment held for moderation.

## Media
- Default image size dimensions (thumbnail/medium/large — width × height, crop toggle),
  "organize uploads into month/year folders" toggle.

## Permalinks
- URL structure radio group: Plain, Day and name, Month and name, Post name, Custom
  structure (with a tag builder: `/%postname%/`, `/%year%/%monthnum%/%postname%/`, etc.)
  — live example URL preview updates as the structure changes. Warn that changing this
  can break existing external links (offer auto-redirect/rewrite rules on change).

## Privacy
- Select/create the Privacy Policy page.
- **Export/erase personal data** request queues (GDPR-style): a list-table of pending
  requests (email, request type, status), with "Send confirmation email", "Complete
  request" (generates a downloadable data export or performs the erasure), and an audit
  trail of completed requests.
