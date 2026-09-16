# VARKA stack (locked)

| Layer | Choice |
|-------|--------|
| Package manager | **pnpm 12.4.2** |
| Node | **>= 24** |
| Public site | Astro **7.3.2** |
| Admin / API | Next.js **16.3.5** |
| React | **19.3.0** |
| TypeScript | **7.0.2** (locked by owner) |
| Zod | **^4.6.5** |
| Prisma | **7.10.0** |
| Auth | Better Auth **^1.7.4** |
| Lint | ESLint **10.10.0** + **@babel/eslint-parser** (TS/TSX) |
| Format | Prettier **3.9.6** |

## Lint + TypeScript 7

`typescript-eslint` does **not** support TypeScript 7.0 yet.  
ESLint uses **Babel** (`@babel/eslint-parser` + `@babel/preset-typescript`) to parse TS/TSX.

- **Lint** = style / basic safety (unused vars, eqeqeq, no-eval)
- **Typecheck** = real types via `tsc` (`pnpm typecheck`)

When typescript-eslint adds TS 7+ support, we can switch the parser back.

```bash
pnpm install
pnpm lint
pnpm typecheck
```
