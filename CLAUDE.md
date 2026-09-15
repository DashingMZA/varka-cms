# CLAUDE.md — VARKA

Read this first every session. Then `ai/owner.md`, then `ai/memory/current.md`.

## Product

**VARKA** — production WordPress-style Blog CMS:

- Astro 7 public site (HTML-first, SEO, themes)
- Next.js 16.3 admin + API
- PostgreSQL + Prisma 7.10 (not 8 RC)
- Redis, S3-compatible media, Tiptap, Better Auth, Zod

Identity and contacts: **`ai/owner.md` only**. Do not invent email, phone, or domains.

## Before writing application code

1. Read `ai/memory/current.md` and the active phase TASKS.md
2. Execute **one** pending task unless the user says otherwise
3. Typecheck / test the slice when applicable
4. **Always update memory:**
   - `ai/phaseN/TASKS.md` checkbox + table status
   - `ai/memory/phaseN/STATUS.md` log row
   - `ai/memory/phaseN/tasks/{id}.md` task card
   - `ai/memory/current.md`
5. Never mark complete because folders exist

## Stack lock (researched 2026-09-14)

| Package | Lock |
|---|---|
| pnpm | 11.27.0 |
| Next.js | 16.3.5 |
| Astro | 7.3.x |
| Prisma | 7.10.x (not 8 RC) |
| Better Auth | latest stable compatible with Next 16.3 |
| Tailwind | 4.x |
| Zod | 4.x |
| TypeScript | 5.9.x |

## Structure

```
apps/admin          Next.js 16 admin + API
apps/web            Astro 7 public
packages/*          database, auth, config, types, validation, permissions, …
ai/                 agent memory, phases, owner.md
```

## Forbidden

- Fake/mock data on production paths
- Prisma 8 RC
- Inventing owner.md fields
- Claiming complete without gate output
- Skipping memory updates after a task

## Agent config

- Agents: `.claude/agents/`
- Skills: `.claude/skills/` (memory-update, phase-workflow, varka-stack, prisma-safe, diagram-design)
- Grok twin: `.grok/` (GROK.md + skills)
- Roster: `ai/AGENTS.md`

