# VARKA agents

Agents coordinate via **memory**, not chat history alone.

## Roster

| Agent ID | Role | Primary paths |
|----------|------|----------------|
| `architect` | System design, ADRs, stack locks | `ai/docs/*`, schema |
| `fullstack` | Implement features in apps/packages | `apps/`, `packages/` |
| `db` | Prisma schema, migrations, seed | `packages/database` |
| `security` | AuthZ, headers, audit, secrets | `packages/security`, `packages/auth` |
| `seo` | Meta, sitemap, i18n routes | `packages/seo`, `packages/i18n` |
| `devops` | Docker, deploy, backups | `deploy/`, `docker-compose.yml` |
| `qa` | Tests, RELEASE matrix, gates | `RELEASE.md`, package tests |
| `docs` | README, phase docs, memory hygiene | `ai/`, `README.md` |

## Protocol

1. Read `ai/memory/current.md`
2. Take **one** task from active phase `TASKS.md`
3. Implement + verify
4. Update memory (STATUS log + task card + current.md)
5. Stop or take next only if user asks for batch

## Handoff

Write enough in memory that a **new** agent with no chat history can continue.
