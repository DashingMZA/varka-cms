# VARKA Deploy Runbook

## Architecture

| Service | Port | Role |
|--------|------|------|
| `web` (Astro SSR / Node) | 4321 | Public site |
| `admin` (Next.js) | 3000 | Admin + API |
| `postgres` | 5432 | Primary data |
| `redis` | 6379 | Cache / rate-limit (optional) |

**Tooling:** Node **≥24**, pnpm **12.4.2**

Admin subdomain (production): `adminzb.*` — override via `ADMIN_URL`.

## Prerequisites

- Docker + Docker Compose v2
- Node 24+ / pnpm 12.4.2 (for migrate/seed from host)
- Secrets: `AUTH_SECRET` (≥32 chars), `POSTGRES_PASSWORD`, OAuth keys if used

## First boot

```bash
cp .env.example .env
# set AUTH_SECRET, POSTGRES_PASSWORD, DATABASE_URL, ADMIN_URL, SITE_URL, PUBLIC_API_URL

docker compose up -d postgres redis
# wait healthy

export DATABASE_URL=postgresql://varka:PASSWORD@localhost:5432/varka?schema=public
corepack enable && corepack prepare pnpm@12.4.2 --activate
pnpm install
pnpm db:generate
pnpm db:migrate:dev   # or: pnpm db:migrate (deploy) in prod
pnpm db:seed

docker compose up -d --build admin web
curl -s http://localhost:3000/api/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/
```

## Env checklist

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | Postgres |
| `AUTH_SECRET` | yes | session signing |
| `ADMIN_URL` / `SITE_URL` | yes | origin checks + links |
| `PUBLIC_API_URL` | yes (web **build**) | Astro → admin API (browser-reachable in prod) |
| `REDIS_URL` | no | memory fallback |
| `STORAGE_DRIVER` | no | default `local` |
| `ALLOW_DEV_AUTH_FALLBACK` | prod: **false** | after Better Auth works |
| `SEED_OWNER_EMAIL` / `PASSWORD` | first seed | owner user |

### Vercel (admin only)

- Root Directory: `apps/admin` (or monorepo install from repo root via `vercel.json`)
- Install: `cd ../.. && corepack enable && pnpm install`
- Build: `cd ../.. && pnpm db:generate && pnpm --filter @varka/admin build`
- Env: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_URL`, `SITE_URL`

Web can stay on Docker/Node host or separate Vercel Astro project with `PUBLIC_API_URL` → admin URL.

## Backups

```bash
chmod +x deploy/scripts/*.sh
./deploy/scripts/backup-db.sh
# restore:
./deploy/scripts/restore-db.sh backups/varka-YYYYMMDDTHHMMSSZ.sql.gz
```

Cron example:

```cron
15 2 * * * cd /opt/varka && BACKUP_DIR=/var/backups/varka ./deploy/scripts/backup-db.sh
```

## Migrations (prod)

```bash
pnpm db:generate
pnpm db:migrate          # prisma migrate deploy
```

Never use `db push --accept-data-loss` in production.

## Health

- Admin: `GET /api/health` → `{ ok, cache, database, queueDepth }`
- Postgres / Redis: compose healthchecks
- Web: HTTP 200 on `/`

## Rollback

1. Pin previous image tags / git SHA
2. Restore DB from last good backup
3. Redeploy previous admin+web images

## Security notes

- Do not commit `.env`
- Terminate TLS at reverse proxy (Caddy/nginx/Traefik) — optional `deploy/nginx-web.conf`
- Restrict Postgres/Redis ports to internal network in real prod
- Rotate `AUTH_SECRET` and DB credentials if exposed
- Set `ALLOW_DEV_AUTH_FALLBACK=false` in production
