# Quality gates — VARKA

Minimum commands every phase should keep green.

## Commands (repo root)

```bash
corepack enable && corepack prepare pnpm@12.4.2 --activate
pnpm install          # generates/updates pnpm-lock.yaml (commit the lockfile)
pnpm db:generate      # Prisma client
pnpm typecheck        # workspace packages + admin
pnpm lint             # eslint 10.10.0
pnpm test             # unit tests across packages
pnpm build            # packages then @varka/admin
pnpm gates            # lint + typecheck + test
```

## Gate policy

| Gate | Fail means |
|------|------------|
| `pnpm install` | dependency graph broken |
| `pnpm db:generate` | Prisma schema invalid |
| `pnpm typecheck` | TypeScript regressions |
| `pnpm lint` | style / basic safety rules |
| `pnpm test` | unit regressions |
| `pnpm build` | Next admin cannot ship |

## Notes

- **Lockfile:** commit `pnpm-lock.yaml`. Prefer `pnpm install --frozen-lockfile` in CI when present.
- **No fake green:** do not disable eslint or `ignoreBuildErrors` to pass gates.
- **DB:** migrate/seed need live `DATABASE_URL`; not part of pure compile gates.
- **Vercel:** install from monorepo root; build runs `pnpm db:generate && pnpm --filter @varka/admin build`.
- **Node / pnpm:** ≥24 / 12.4.2 (see root `package.json`).
