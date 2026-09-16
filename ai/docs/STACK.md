# VARKA stack (locked)

| Layer | Choice |
|-------|--------|
| Package manager | **pnpm 12.4.2** |
| Node | **>= 24** |
| Public site | Astro **7.3.2** |
| Admin / API | Next.js **16.3.5** |
| React | **19.3.0** |
| TypeScript | **7.0.2** (owner lock — do not downgrade) |
| Zod | **^4.6.5** |
| Prisma | **7.10.0** |
| Auth | Better Auth **^1.7.4** |
| Lint | ESLint **10.10.0** + **typescript-eslint** ^8 |
| Format | Prettier **3.9.6** |

## ESLint + TypeScript 7

`typescript-eslint` still has a version gate against TS 7.0.  
`eslint.config.mjs` temporarily reports TS as 5.9 to that gate only; the installed compiler stays **7.0.2**. No type-aware (`project: true`) rules until upstream supports TS 7.

Track: https://github.com/typescript-eslint/typescript-eslint/issues/10940

```bash
pnpm install
pnpm lint
pnpm typecheck
```
