# VARKA

Production-oriented WordPress-style Blog CMS.

| Layer | Technology |
|-------|------------|
| Public site | **Astro 7** (SSR / `@astrojs/node`) |
| Admin + API | **Next.js 16** |
| Database | **PostgreSQL** + **Prisma 7.10** |
| Cache | **Redis** (optional; memory fallback) |
| Auth | **Better Auth** + RBAC |
| Media | Local disk or S3/R2 |
| Themes | 10 editorial themes (`@varka/themes`) |

**Tooling:** Node **≥24** · pnpm **12.4.2** · ESLint **10.10.0**

Identity: [`ai/owner.md`](ai/owner.md)  
Architecture: [`ai/docs/ARCHITECTURE.md`](ai/docs/ARCHITECTURE.md)  
Deploy: [`deploy/DEPLOY.md`](deploy/DEPLOY.md)  
Release QA: [`RELEASE.md`](RELEASE.md)  
Agent memory: [`ai/memory/STATUS.md`](ai/memory/STATUS.md)

## Quick start

```bash
cp .env.example .env
# DATABASE_URL, AUTH_SECRET, ADMIN_URL, SITE_URL, PUBLIC_API_URL

corepack enable && corepack prepare pnpm@12.4.2 --activate
pnpm install
pnpm db:generate && pnpm db:migrate:dev && pnpm db:seed

pnpm --filter @varka/admin dev          # http://localhost:3000
PUBLIC_API_URL=http://localhost:3000 pnpm --filter @varka/web dev  # :4321
```

Infra only:

```bash
docker compose up -d postgres redis
```

## Quality gates

```bash
pnpm test
pnpm gates          # lint + typecheck + test
pnpm --filter @varka/admin build
```

## Phase train (source)

| Phase | Focus |
|------|--------|
| 0 | Foundation monorepo |
| 1 | Auth / RBAC / admin shell |
| 2 | Content core |
| 3 | Media |
| 4 | Themes + Astro shell |
| 5 | SEO + i18n routes |
| 6 | Native comments |
| 7 | Cache / rate-limit / queues |
| 8 | Security / audit |
| 9 | Live public content |
| 10 | Docker / deploy / backups |
| 11 | 10 themes + CI |
| 12 | Final QA / release |

Details: `ai/phaseN/` and `ai/memory/STATUS.md`.

## License

Private / unpublished unless otherwise stated by the owner in `ai/owner.md`.
