# Phase 0 tasks — Architecture & Foundation

Status key: `pending` | `in-progress` | `done` | `blocked`

| ID | Module | Task | Status |
|---|---|---|---|
| `0.1` | monorepo | Create pnpm-workspace.yaml and root package.json with filtered scripts | done |
| `0.2` | monorepo | Add apps/admin, apps/web, packages/* empty package.json stubs with names | done |
| `0.3` | monorepo | Shared tsconfig.base.json strict: true, no any, path aliases | done |
| `0.4` | monorepo | ESLint + Prettier + editorconfig; do not disable rules to pass | done |
| `0.5` | env | packages/config: Zod env schema | done |
| `0.6` | env | Generate complete .env.example | done |
| `0.7` | env | Secret redaction helper for logs | done |
| `0.8` | database | Prisma schema PostgreSQL; Prisma 7.10.x target | done |
| `0.9` | database | Site, Language, SiteSetting models + seed | done |
| `0.10` | database | Migration workflow scripts | done |
| `0.11` | packages | packages/types | done |
| `0.12` | packages | packages/validation | done |
| `0.13` | packages | packages/permissions | done |
| `0.14` | docs | STRUCTURE.md + STACK.md | done |
| `0.15` | docs | ADRs recorded | done |
| `0.16` | monorepo | .gitignore | done |
| `0.17` | monorepo | Lockfile committed; packageManager pnpm@11.27.0 | blocked |
| `0.18` | docs | Quality gates | blocked |

## Checkboxes

- [x] **0.1** — workspace + root package.json
- [x] **0.2** — apps/packages stubs
- [x] **0.3** — tsconfig.base.json
- [x] **0.4** — ESLint + Prettier + editorconfig
- [x] **0.5** — Zod env schema
- [x] **0.6** — .env.example
- [x] **0.7** — secret redaction
- [x] **0.8** — Prisma schema files
- [x] **0.9** — Site / Language / SiteSetting
- [x] **0.10** — db scripts
- [x] **0.11** — types
- [x] **0.12** — validation
- [x] **0.13** — permissions
- [x] **0.14** — STRUCTURE + STACK
- [x] **0.15** — ADRs
- [x] **0.16** — .gitignore
- [ ] **0.17** — lockfile (blocked: install OOM)
- [ ] **0.18** — quality gates (blocked: depends on 0.17)
