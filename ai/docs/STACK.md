# VARKA stack (locked)

| Layer | Choice |
|-------|--------|
| Package manager | **pnpm 12.4.2** |
| Node | **>= 24** |
| Public site | Astro **7.3.2** |
| Admin / API | Next.js **16.3.5** |
| React | **19.3.0** |
| TypeScript | **7.0.2** (locked — do not downgrade) |
| Zod | **^4.6.5** |
| Prisma | **7.10.0** |
| Auth | Better Auth **^1.7.4** |
| Lint | **oxlint** (primary) · ESLint 10 for JS-only `lint:js` |
| Format | Prettier **3.9.6** |

## Why oxlint?

- `typescript-eslint@8` peer range is `typescript < 6.1` and **crashes on TS 7** (`ModuleKind.Cjs`).
- `@babel/eslint-parser` breaks on ESLint 10 (`scopeManager.addGlobals`).
- **oxlint** parses TS/TSX without that peer gate.

Types remain enforced by `pnpm typecheck` (`tsc` 7.0.2).

```bash
pnpm install
pnpm lint        # oxlint
pnpm typecheck   # tsc 7.0.2
```
