# Quality gates — VARKA

Phase 0 defines the minimum commands every later phase must keep green.

## Commands (repo root)

```bash
corepack enable && corepack prepare pnpm@11.27.0 --activate
pnpm install          # generates/updates pnpm-lock.yaml (commit the lockfile)
pnpm db:generate      # Prisma client
pnpm typecheck        # workspace packages + admin
pnpm lint             # eslint.config.mjs
pnpm test             # unit tests (config, permissions, auth, …)
pnpm build            # packages then @varka/admin
```

## Gate policy

| Gate | Fail means |
|------|------------|
| `pnpm install` | dependency graph broken |
| `pnpm db:generate` | Prisma schema invalid |
| `pnpm typecheck` | TypeScript regressions |
| `pnpm lint` | style / basic safety rules |
| `pnpm test` | unit regressions |
| `pnpm build` | Next admin (or selected apps) cannot ship |

## Notes

- **Lockfile:** always commit `pnpm-lock.yaml`. CI and Vercel must use `pnpm install --frozen-lockfile` when lockfile is present.
- **No fake green:** do not disable eslint rules or `ignoreBuildErrors` to pass gates.
- **DB:** migrate/seed require a live `DATABASE_URL`; not part of pure compile gates.
- **Vercel:** install from monorepo root; build runs `pnpm db:generate && pnpm --filter @varka/admin build`.
