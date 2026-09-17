# AGENTS.md — VARKA

Instructions for any coding agent (Claude, Grok, Codex, etc.) working on this repo.

## Project overview

**VARKA** is a production-oriented WordPress-style Blog CMS:

| Layer | Tech |
|-------|------|
| Public site | Astro 7 (`apps/web`) |
| Admin + API | Next.js 16 App Router (`apps/admin`) |
| Database | PostgreSQL + Prisma 7.10 (`packages/database`) |
| Auth | Better Auth (`packages/auth`) |
| Media | local + S3/R2 adapters (`packages/media`) |
| Validation | Zod (`packages/validation`) |
| Permissions | RBAC catalog (`packages/permissions`) |

Monorepo: **pnpm workspaces**. Package manager and Node engines are defined in root `package.json`.

### Key paths

```
apps/admin/src/app/(dashboard)/   Admin screens
apps/admin/src/app/api/           Route handlers
apps/admin/src/components/        Admin UI components
packages/database/prisma/         Schema + migrations
ai/owner.md                       Product owner identity (source of truth)
ai/memory/                        Phase-level agent memory
.claude/skills/                   Skills
.claude/memory/tasks/             Per-task memory log
```

### Run / build / test

```bash
pnpm install
pnpm db:generate && pnpm db:migrate:dev && pnpm db:seed
pnpm dev:admin
pnpm typecheck
pnpm lint
```

## Skills

### Admin dashboard (required)

Whenever working on the admin dashboard (any screen, feature, design, or security work), read:

**`.claude/skills/wp-admin-dashboard/SKILL.md` first**, then the specific reference file for the module being touched under `.claude/skills/wp-admin-dashboard/references/`.

**Do not skip modules.** Full feature parity with WordPress `wp-admin` is required.

References cover: navigation, dashboard widgets, list-table pattern, content editor, media library, users/roles, comments, appearance, settings, design system, security, and the Prisma data model.

### Other skills

| Skill | Path |
|-------|------|
| Stack | `.claude/skills/varka-stack/SKILL.md` |
| Phase workflow | `.claude/skills/phase-workflow/SKILL.md` |
| Memory update | `.claude/skills/memory-update/SKILL.md` |
| Prisma safe | `.claude/skills/prisma-safe/SKILL.md` |
| Diagram design | `.claude/skills/diagram-design/SKILL.md` |

## Per-task memory

After finishing **every** task that changes the codebase:

1. Add `.claude/memory/tasks/<short-task-slug>.md` with: date, ask, changes, skills used, follow-ups
2. Update `.claude/memory/tasks/README.md` (newest first)

At the **start** of a new task, read the memory index for related prior decisions.

## Agents roster

Detailed agent roles: `ai/AGENTS.md` and `.claude/agents/*.md` (architect, fullstack, db, security, devops, qa).

## Rules

- Do not invent owner contact data — use `ai/owner.md`
- Do not mark work complete without verification
- Prefer incremental, tested changes over large untested dumps
