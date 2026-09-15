# VARKA

Production-oriented WordPress-style Blog CMS.

| Layer | Technology |
|-------|------------|
| Public site | **Astro 7** |
| Admin + API | **Next.js 16** |
| Database | **PostgreSQL** + **Prisma 7.10** |
| Cache | **Redis** (optional; memory fallback) |
| Auth | **Better Auth** |
| Media | Local disk or S3/R2 |
| Themes | 10 editorial themes (`@varka/themes`) |

Identity: [`ai/owner.md`](ai/owner.md)  
Architecture: [`ai/docs/ARCHITECTURE.md`](ai/docs/ARCHITECTURE.md)  
Deploy: [`deploy/DEPLOY.md`](deploy/DEPLOY.md)  
Release QA: [`RELEASE.md`](RELEASE.md)  
Agent memory: [`ai/memory/current.md`](ai/memory/current.md)

## Quick start

```bash
cp .env.example .env
# DATABASE_URL, AUTH_SECRET, ADMIN_URL, SITE_URL, PUBLIC_API_URL

corepack enable && corepack prepare pnpm@11.27.0 --activate
pnpm install
pnpm db:generate && pnpm db:migrate:dev && pnpm db:seed

pnpm --filter @varka/admin dev          # http://localhost:3000
PUBLIC_API_URL=http://localhost:3000 pnpm --filter @varka/web dev  # :4321
```

Infra only:

```bash
docker compose up -d postgres redis
```

## Phase train

| Phase | Focus | Zip |
|------|--------|-----|
| 0 | Foundation | `dist/varka-phase0-foundation.zip` |
| 1 | Auth / RBAC / admin shell | `dist/varka-phase1-auth.zip` |
| 2 | Content core | `dist/varka-phase2-content.zip` |
| 3 | Media | `dist/varka-phase3-media.zip` |
| 4 | Themes + Astro shell | `dist/varka-phase4-themes.zip` |
| 5 | SEO + i18n routes | `dist/varka-phase5-seo-i18n.zip` |
| 6 | Comments | `dist/varka-phase6-comments.zip` |
| 7 | Cache / rate-limit / queues | `dist/varka-phase7-cache.zip` |
| 8 | Security / audit | `dist/varka-phase8-security.zip` |
| 9 | Live public content | `dist/varka-phase9-performance.zip` |
| 10 | Docker / deploy / backups | `dist/varka-phase10-devops.zip` |
| 11 | 10 themes + CI | `dist/varka-phase11-themes-ci.zip` |
| 12 | Final QA / release | `dist/varka-phase12-release.zip` |

## License

Private / unpublished unless otherwise stated by the owner in `ai/owner.md`.
