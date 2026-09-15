# Phase 0: Architecture & Foundation

**Status:** `done` (source foundation)  
**Depends on:** none  
**Goal:** Portable pnpm monorepo, shared config, Prisma foundation, env schema, package stubs.

## When this phase is done

All tasks in [TASKS.md](./TASKS.md) checked. See [QUALITY-GATES.md](../docs/QUALITY-GATES.md).

## Modules delivered

- **monorepo** — workspace root, apps/packages, gitignore, eslint, prettier
- **env** — Zod env schema (`@varka/config`), `.env.example`, secret redaction
- **database** — Prisma 7.10, Site / Language / SiteSetting, seed, initial migration
- **packages** — types, validation, permissions catalogs
- **docs** — STACK, STRUCTURE, DECISIONS, quality gates

## Operator one-time

Commit `pnpm-lock.yaml` after first successful `pnpm install` on a machine with enough RAM (agent sandbox may OOM).
