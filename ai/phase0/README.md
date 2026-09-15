# Phase 0: Architecture & Foundation

**Status:** `in-progress`  
**Depends on:** none  
**Goal:** Portable pnpm monorepo, shared config, Prisma foundation, env schema, package stubs — no fake CMS features.

## When this phase is done

All tasks in [TASKS.md](./TASKS.md) checked. Quality gates green. Memory updated (`COMPLETE.md`).

## Modules

- **monorepo** — workspace root, apps/packages stubs, gitignore, lockfile
- **env** — Zod env schema, `.env.example`, secret redaction
- **database** — Prisma 7.10, Site / Language / SiteSetting
- **packages** — types, validation, permissions catalogs
- **docs** — stack/structure notes + ADRs + gates

## Start command for the agent

```
Read ai/owner.md, ai/memory/current.md, ai/memory/project.md, ai/phase0/README.md, ai/phase0/TASKS.md.
Execute the next pending task only. After the task: update TASKS.md, memory/phase0/STATUS.md, task card, current.md.
```
