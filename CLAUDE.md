# CLAUDE.md — VARKA

Read this first every session. Then `ai/owner.md`, then `ai/memory/current.md`, then the **Skills** section below when touching the admin dashboard.

## Product

**VARKA** — production WordPress-style Blog CMS:

- Astro 7 public site (HTML-first, SEO, themes)
- Next.js 16.3 admin + API
- PostgreSQL + Prisma 7.10 (not 8 RC)
- Redis, S3-compatible media, Tiptap, Better Auth, Zod

Identity and contacts: **`ai/owner.md` only**. Do not invent email, phone, or domains.

## Skills

### Required for admin dashboard work

**Whenever working on the admin dashboard** (any screen, feature, design, or security work), read:

1. `.claude/skills/wp-admin-dashboard/SKILL.md` **first**
2. Then the specific reference file under `.claude/skills/wp-admin-dashboard/references/` for the module being touched

**Do not skip modules.** Full feature parity with WordPress `wp-admin` is required — not a partial clone.

| Module | Reference |
|--------|----------|
| Navigation / IA | `references/navigation-ia.md` |
| Dashboard widgets | `references/dashboard-widgets.md` |
| List tables (posts/pages/media/users/comments) | `references/list-table-pattern.md` |
| Content editor | `references/content-editor.md` |
| Media library | `references/media-library.md` |
| Users & roles | `references/users-roles.md` |
| Comments | `references/comments-moderation.md` |
| Appearance | `references/appearance-customization.md` |
| Settings | `references/settings-pages.md` |
| Design system | `references/design-system.md` |
| Security | `references/security.md` |
| Prisma data model | `references/data-model-nextjs.md` |

### Other project skills

- `.claude/skills/varka-stack/` — stack lock & monorepo conventions
- `.claude/skills/phase-workflow/` — phase/task workflow
- `.claude/skills/memory-update/` — how to update `ai/memory`
- `.claude/skills/prisma-safe/` — safe Prisma migrate/generate patterns
- `.claude/skills/diagram-design/` — architecture diagrams

## Per-task memory (admin / code changes)

After **every** task that changes the codebase:

1. Write `.claude/memory/tasks/<short-task-slug>.md` (one task per file)
2. Update `.claude/memory/tasks/README.md` (newest first, one-line summary + link)

Before starting a **new** task, read `.claude/memory/tasks/README.md` for related prior work.

Also continue phase memory under `ai/memory/` as before.

## Before writing application code

1. Read `ai/memory/current.md` and the active phase TASKS.md
2. Check `.claude/memory/tasks/README.md` for related prior tasks
3. If admin dashboard work → read `wp-admin-dashboard` skill + module reference
4. Execute **one** pending task unless the user says otherwise
5. Typecheck / test the slice when applicable
6. **Always update memory** (phase files + `.claude/memory/tasks/` when code changed)
7. Never mark complete because folders exist

## Stack lock

| Package | Lock |
|---|---|
| pnpm | 12.4.2 (operator may use project `packageManager`) |
| Node | >= 24 |
| Next.js | 16.3.x |
| Astro | 7.3.x |
| Prisma | 7.10.x (not 8 RC) |
| TypeScript | 7.0.x when locked in root package.json |
| Better Auth | latest stable compatible with Next 16.3 |
| Tailwind | 4.x |
| Zod | 4.x |

Verify versions in root `package.json` / workspace packages at implement time.

## Structure

```
apps/admin          Next.js 16 admin + API
apps/web            Astro 7 public
packages/*          database, auth, config, types, validation, permissions, …
ai/                 agent memory, phases, owner.md
.claude/skills/     skills including wp-admin-dashboard
.claude/memory/     per-task memory logs
```

## How to run

```bash
pnpm install
pnpm db:generate && pnpm db:migrate:dev && pnpm db:seed
pnpm dev:admin    # :3000
pnpm --filter @varka/web dev   # :4321
pnpm typecheck
pnpm lint
```

## Forbidden

- Fake/mock data on production paths
- Prisma 8 RC
- Inventing owner.md fields
- Claiming complete without gate output
- Skipping memory updates after a task
- Building admin UI without reading `wp-admin-dashboard` skill

## Agent config

- Agents: `.claude/agents/`
- Skills: `.claude/skills/`
- Task memory: `.claude/memory/tasks/`
- Grok twin: `.grok/` when present
- Roster: `ai/AGENTS.md` and root `AGENTS.md`
