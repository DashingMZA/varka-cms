# Phase 10 — COMPLETE (DevOps)

**Marked:** 2026-09-16

## Delivered

- `docker-compose.yml` — postgres, redis, admin, web
- `deploy/Dockerfile.admin` — Node 24, pnpm 12.4.2, Next standalone
- `deploy/Dockerfile.web` — Astro **SSR** Node entry (not static nginx)
- `deploy/nginx-web.conf` — optional reverse proxy
- backup / restore / migrate scripts
- `DEPLOY.md` + Vercel notes
- CI: Node 24 + pnpm 12.4.2
- `.dockerignore`

```bash
docker compose config -q
docker compose up -d postgres redis
```
