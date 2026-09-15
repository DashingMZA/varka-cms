---
name: prisma-safe
description: Safe Prisma 7 workflow for VARKA
---

# Prisma 7 notes

- `url` is **not** in `schema.prisma` — use `packages/database/prisma.config.js`
- Generate: `pnpm db:generate`
- Dev: `pnpm db:migrate:dev`
- Prod: `pnpm db:migrate` (deploy)
- Avoid destructive push in production
