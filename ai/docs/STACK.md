# VARKA stack (locked)

| Layer | Choice |
|-------|--------|
| Package manager | **pnpm 12.4.2** (`packageManager` field) |
| Node | **>= 24** |
| Public site | Astro 7 HTML-first |
| Admin / API | Next.js 16.3 App Router |
| Language | TypeScript strict |
| DB | PostgreSQL + Prisma **7.10.x** |
| Auth | Better Auth |
| Validation | Zod |
| Lint | **ESLint 10.10.0** |
| Format | Prettier 3.x |
| Cache | Redis optional; memory default |
| Media | local + S3/R2 (`STORAGE_DRIVER`) |
| Editor | Tiptap (admin content) |
| CSS | Tailwind + shadcn/ui (admin); theme CSS tokens (public) |

Activate tooling:

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
node -v   # >= 24
pnpm -v   # 12.4.2
```
