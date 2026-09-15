# VARKA — run on your machine

## Requirements

- Node.js 22+
- pnpm 11.27.0 (`corepack prepare pnpm@11.27.0 --activate`)
- PostgreSQL 16+

## Setup

```bash
# extract zip, then:
cd varka   # or folder name after unzip

cp .env.example .env
# Edit .env:
#   DATABASE_URL=postgresql://...
#   AUTH_SECRET=<random 32+ chars>
#   SITE_URL=http://localhost:4321
#   ADMIN_URL=http://localhost:3000
#   SEED_OWNER_EMAIL=you@example.com
#   SEED_OWNER_PASSWORD=your-strong-password

corepack enable
corepack prepare pnpm@11.27.0 --activate
pnpm install

pnpm db:generate
pnpm --filter @varka/database migrate:dev   # creates tables
pnpm db:seed

pnpm --filter @varka/admin dev
```

Open http://localhost:3000/login

## Phase zips

| Zip | Contents |
|---|---|
| `dist/varka-phase0-foundation.zip` | Monorepo foundation only |
| `dist/varka-phase1-auth.zip` | Foundation + auth/RBAC/admin shell |

After each phase completes, a new zip is published under `dist/`.


## Prisma migrate error: datasource.url property is required

Prisma 7 reads URL from `packages/database/prisma.config.js`, which loads the **monorepo root** `.env`.

1. Ensure `D:/github/zaheer/VARKA/.../.env` exists (next to `pnpm-workspace.yaml`)
2. Ensure it contains a non-empty line:
   ```
   DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB?sslmode=require
   ```
3. Re-run:
   ```bash
   pnpm db:generate
   pnpm db:migrate:dev
   # first time, when prompted for name: init
   pnpm db:seed
   ```

If migrate still fails on an empty DB you already pushed with `db push`, use:

```bash
pnpm --filter @varka/database db:push
pnpm db:seed
```


## Seed: PrismaClient export error (ESM)

If you see `does not provide an export named 'PrismaClient'`:

1. Regenerate client after installing pg/adapter:
   ```bash
   pnpm db:generate
   pnpm db:seed
   ```
2. Seed uses `createRequire` so CJS `@prisma/client` works under ESM/tsx on Windows.

