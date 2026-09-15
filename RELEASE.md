# VARKA Release Checklist (v0.1)

**Product:** VARKA — WordPress-style Blog CMS  
**Stack:** Astro public (SSR) + Next.js admin + PostgreSQL/Prisma + Redis (optional)  
**Tooling:** Node ≥24 · pnpm 12.4.2 · ESLint 10.10.0

## Pre-release

1. [ ] `AUTH_SECRET` rotated / strong (≥32 chars)
2. [ ] `DATABASE_URL` not committed; backups configured
3. [ ] `ADMIN_URL` / `SITE_URL` / `PUBLIC_API_URL` correct for environment
4. [ ] `ALLOW_DEV_AUTH_FALLBACK=false` in production
5. [ ] Owner account created (seed or sign-up) via Better Auth
6. [ ] OAuth keys only if providers enabled
7. [ ] `STORAGE_DRIVER` chosen (`local` vs `s3`)

## Build

```bash
corepack enable && corepack prepare pnpm@12.4.2 --activate
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm test
pnpm --filter @varka/admin build
pnpm --filter @varka/web build
```

## Smoke

```bash
pnpm --filter @varka/admin dev   # :3000
PUBLIC_API_URL=http://localhost:3000 pnpm --filter @varka/web dev  # :4321
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/public/theme | head
curl -s http://localhost:4321/sitemap.xml | head
```

- [ ] Create draft post → publish → appears on public home
- [ ] Upload media under `/media`
- [ ] Submit comment → approve in `/comments`
- [ ] Switch theme in `/appearance` (all 10 listed)
- [ ] Audit row appears in `/system`
- [ ] Health shows cache + database

## Deploy

Follow [`deploy/DEPLOY.md`](deploy/DEPLOY.md).

- [ ] TLS at reverse proxy
- [ ] Postgres/Redis not public
- [ ] Cron backup `./deploy/scripts/backup-db.sh`
- [ ] Vercel (admin): monorepo install + `db:generate` + filter build

## Rollback

1. Previous container images / git SHA
2. Restore DB from `backups/varka-*.sql.gz`

## Human acceptance

Operator signs `ai/phase12/ACCEPTANCE.md` after local QA matrix passes.
