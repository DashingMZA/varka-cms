# Phase 12: Final QA & Release

Release gate for VARKA v0.1 source train (phases 0–11).

## What “done” means

- Source architecture present and documented
- Remote Postgres schema includes auth, content, media, audit
- Each phase has TASKS + memory STATUS
- Zips published under `dist/` for local verification
- Runtime gates (full `pnpm install` / e2e login) run on a machine with enough RAM and Node 22

## QA matrix (run locally)

| Area | Check | Pass? |
|------|--------|-------|
| Install | `pnpm install` | |
| DB | `pnpm db:generate && pnpm db:migrate && pnpm db:seed` | |
| Unit | `pnpm test` (packages) | |
| Admin | login, create post, publish | |
| Media | upload under `/media` | |
| Comments | public submit → moderate | |
| Themes | activate theme-01…10 | |
| Public | Astro lists published posts | |
| SEO | `/sitemap.xml`, `/robots.txt` | |
| Health | `GET /api/health` | |
| Docker | `docker compose up postgres redis` | |
| Backup | `./deploy/scripts/backup-db.sh` | |

## Non-goals for v0.1 source train

- Full Tiptap package install verified in CI
- Multi-region Redis/BullMQ production cluster
- Perfect CSP without `unsafe-inline` under Next dev
- 18 languages fully translated UI strings (schema + routing ready)
