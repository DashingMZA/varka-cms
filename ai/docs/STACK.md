# VARKA stack (locked)

| Layer | Choice |
|-------|--------|
| Package manager | **pnpm 12.4.2** |
| Node | **>= 24** |
| Public site | Astro **7.3.2** |
| Admin / API | Next.js **16.3.5** |
| React | **19.3.0** |
| TypeScript | **^7.0.2** (no `baseUrl` in tsconfig — removed in TS 7) |
| Zod | **^4.6.5** |
| Prisma | **7.10.0** |
| Auth | Better Auth **^1.7.4** |
| Lint | ESLint **10.10.0** |
| Format | Prettier **3.9.6** |

`@varka/*` packages resolve via **pnpm workspace** (`node_modules`), not via `paths`/`baseUrl`.

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
pnpm install
pnpm typecheck
```
