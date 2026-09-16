# VARKA stack (locked)

| Layer | Choice |
|-------|--------|
| Package manager | **pnpm 12.4.2** |
| Node | **>= 24** |
| Public site | Astro **7.3.2** |
| Admin / API | Next.js **16.3.5** |
| React | **19.3.0** |
| TypeScript | **~5.9.2** (not 7.x yet — `typescript-eslint` has no TS 7 support) |
| Zod | **^4.6.5** |
| Prisma | **7.10.0** |
| Auth | Better Auth **^1.7.4** |
| Lint | ESLint **10.10.0** + **typescript-eslint** ^8 |
| Format | Prettier **3.9.6** |

## Why not TypeScript 7?

As of 2026-09, `typescript-eslint` throws:

> typescript-eslint does not support TS 7.0

Track: https://github.com/typescript-eslint/typescript-eslint/issues/10940  
When that lands, bump `typescript` monorepo-wide and re-enable TS 7.

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
pnpm install
pnpm lint && pnpm typecheck
```
