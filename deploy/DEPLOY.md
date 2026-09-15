# VARKA Deploy Runbook

## Architecture

| Service | Port | Role |
|--------|------|------|
| `web` (Astro static / nginx) | 4321 | Public site |
| `admin` (Next.js) | 3000 | Admin + API |
| `postgres` | 5432 | Primary data |
| `redis` | 6379 | Cache / rate-limit (optional) |

Admin subdomain (production): `adminzb.*` — override via `ADMIN_URL`.

## Prerequisites

- Docker + Docker Compose v2
- Node 22+ / pnpm 11.27.0 (for migrate/seed from host)
- Secrets: `AUTH_SECRET` (≥32 chars), `POSTGRES_PASSWORD`, OAuth keys if used

## First boot

```bash
cp .env.example .env
# set AUTH_SECRET, POSTGRES_PASSWORD, DATABASE_URL, ADMIN_URL, SITE_URL, PUBLIC_API_URL

docker compose up -d postgres redis
# wait healthy

export DATABASE_URL=postgresql://varka:PASSWORD@localhost:5432/varka?schema=public
pnpm install
pnpm db:generate
pnpm db:migrate:dev   # or migrate deploy in prod
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
| `PUBLIC_API_URL` | yes (web build) | Astro → admin API |
| `REDIS_URL` | no | memory fallback |
| `STORAGE_DRIVER` | no | default `local` |
| `SEED_OWNER_EMAIL` / `PASSWORD` | first seed | owner user |

## Backups

```bash
./deploy/scripts/backup-db.sh
# restore:
./deploy/scripts/restore-db.sh backups/varka-YYYYMMDDTHHMMSSZ.sql.gz
```

Schedule daily via cron:

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

- Admin: `GET /api/health` → `{ ok, cache }`
- Postgres / Redis: compose healthchecks

## Rollback

1. `docker compose images` / pin previous image tags
2. Restore DB from last good backup
3. Redeploy previous admin+web images

## Security notes

- Do not commit `.env`
- Terminate TLS at reverse proxy (Caddy/nginx/Traefik)
- Restrict Postgres/Redis ports to internal network in real prod
- Rotate `AUTH_SECRET` and DB credentials if exposed
