# setup-wp-admin-skill-and-memory

- **Date:** 2026-09-18
- **Asked:** Set up project memory + skill references for the Next.js admin dashboard — install `wp-admin-dashboard` skill, document it in CLAUDE.md / AGENTS.md, create per-task memory log + index.

## Built / changed

| Path | Change |
|------|--------|
| `.claude/skills/wp-admin-dashboard/SKILL.md` | Installed from provided skill zip |
| `.claude/skills/wp-admin-dashboard/references/*.md` | 12 module references (nav, widgets, list-table, editor, media, users, comments, appearance, settings, design, security, data model) |
| `CLAUDE.md` | Added **Skills** section (required admin skill + reference table); per-task memory rules; stack/run notes refreshed |
| `AGENTS.md` | **Created** — project overview, stack, run commands, Skills section (same admin requirement), task memory rules |
| `.claude/memory/tasks/README.md` | **Created** — index (newest first) |
| `.claude/memory/tasks/setup-wp-admin-skill-and-memory.md` | This file |

## Key decisions

- Skill lives under `.claude/skills/wp-admin-dashboard/` so agents discover it with other skills.
- Task memory is **additive** to existing `ai/memory/` phase workflow — not a replacement.
- CLAUDE.md and AGENTS.md both state: read SKILL.md first, then module reference; full WP parity required.

## Skills / references used

- Packaged skill zip: `wp-admin-dashboard` (SKILL.md + all references)
- Existing: `.claude/README.md`, prior CLAUDE.md structure

## Follow-ups / open issues

- Future code tasks should each add a new `.claude/memory/tasks/<slug>.md` and update this index.
- Optional: mirror a short pointer in `ai/memory/current.md` linking to `.claude/memory/tasks/README.md`.
