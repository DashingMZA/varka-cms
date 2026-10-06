# Admin Color Scheme — Official WordPress Themes

Date: 2026-10-06

## Ask
User wanted:
1. Rename `wp-admin-extra.css` → `admin-extra.css`, `wp-login-media.css` → `login-media.css`
2. Remove all `wp-` prefixes from CSS classes/variables (use `varka-` only if conflicts, prefer no prefix)
3. Fix profile page blocks (borders, alignment), button colors, menu names
4. Provided `wp-admin.zip` with official WordPress admin files — use CSS, match VARKA dashboard to WP
5. 100% dynamic fix, no fallbacks/workarounds ("jugaad nahi chahiye")

## Changes
- Renamed: `wp-admin-extra.css` → `admin-extra.css`, `wp-login-media.css` → `login-media.css`, `tiptap-wp.css` → `tiptap.css`
- Removed `wp-` prefix from all CSS variables (`--wp-accent` → `--accent`) and classes across 12 TSX components + 5 CSS files
- Updated `layout.tsx` imports
- Extracted official WordPress colors from `wp-admin/css/colors/*/colors.scss`:
  - blue: #245278/#437aa8, coffee: #5c4c40/#916745, ectoplasm: #4a3369/#646c3e
  - light: #e5e5e5/#007cba, midnight: #333c42/#cf4339, ocean: #39535a/#567958
  - sunrise: #8a312d/#ad631e, modern: #1e1e1e/#3858e9, fresh: #1d2327/#0073aa
- Added `modern` scheme to picker + `ADMIN_SCHEMES` validation in `packages/auth/src/users.ts`
- Added explicit `default` scheme CSS rule (was missing — caused gray buttons)
- Simplified theme CSS: removed redundant `html[data-admin-scheme]` selectors, single source `.v-admin[data-admin-scheme]`
- Fixed light theme: current/open menu items now dark text (was white-on-light-gray invisible)

## Skills used
- `.claude/skills/wp-admin-dashboard/SKILL.md` (per AGENTS.md requirement)

## Follow-ups
- User testing light theme sidebar visibility
- Profile page block borders/alignment still needs visual QA
- Button hover states need verification across all schemes
