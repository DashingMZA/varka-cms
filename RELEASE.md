# VARKA Release Checklist (v0.1)

**Product:** VARKA — WordPress-style Blog CMS  
**Stack:** Astro public + Next.js admin + PostgreSQL/Prisma + Redis (optional)

## Pre-release

1. [ ] `AUTH_SECRET` rotated / strong
2. [ ] `DATABASE_URL` not committed; backups configured
3. [ ] `ADMIN_URL` / `SITE_URL` / `PUBLIC_API_URL` correct for environment
4. [ ] Owner account created (seed or sign-up) and password set via Better Auth
5. [ ] OAuth keys only if providers enabled
6. [ ] `STORAGE_DRIVER` chosen (`local` vs `s3`/`r2`)

## Build

```bash
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
curl -s http://localhost:4321/sitemap.xml | head
```

- [ ] Create draft post → publish → appears on public home
- [ ] Upload media
- [ ] Submit comment → approve in `/comments`
- [ ] Switch theme in `/appearance`
- [ ] Audit row appears in `/system`

## Deploy

Follow `deploy/DEPLOY.md`.

- [ ] TLS at reverse proxy
- [ ] Postgres/Redis not public
- [ ] Cron backup `./deploy/scripts/backup-db.sh`

## Rollback

1. Previous container images
2. Restore DB from `backups/varka-*.sql.gz`
