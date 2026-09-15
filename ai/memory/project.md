# Product decisions — VARKA

Status: `locked` | `recommended` | `unlocked`

| ID | Topic | Status | Value |
|---|---|---|---|
| D01 | Product | locked | WordPress-style blog CMS (VARKA), not a toy |
| D02 | Public app | locked | Astro 7 HTML-first |
| D03 | Admin app | locked | Next.js 16.3 App Router |
| D04 | DB | locked | PostgreSQL + Prisma **7.10.x** (not Prisma 8 RC) |
| D05 | Auth | locked | Better Auth |
| D06 | Source of truth | locked | Postgres; Markdown/RSS/sitemap/search/cache derived |
| D07 | Theme model | locked | One contract, 10 implementations; V1 ships theme-01 + theme-08 first |
| D08 | i18n | locked | 18 languages DB-driven; language ≠ script (script is a field) |
| D09 | Punjabi | locked | One language row (`pa`) + `script` field (not two rows) |
| D10 | Package manager | locked | pnpm 11.27.0 workspaces |
| D11 | Target | locked | Portable production monorepo (Next + Astro) |
| D12 | Admin URL | locked | Configurable host; default subdomain `adminzb` in prod |
| D13 | Default language | locked | English (`en`) |
| D14 | Default URL shape | locked | Prefixless default lang; posts at `/post/{slug}`; other langs `/{prefix}/post/{slug}` |
| D15 | V1 auth providers | locked | Email/password + Google + GitHub |
| D16 | V1 comments | locked | Native (not third-party) |
| D17 | V1 media | locked | Local disk + S3/R2 adapters day 1; `STORAGE_DRIVER` selects |
| D18 | V1 themes | locked | theme-01 Clean Editorial + theme-08 Dark Editorial first |
| D19 | Brand | locked | **VARKA** (see `ai/owner.md`) |
| D20 | Topology | locked | Two apps / two hosts; local admin:3000, web:4321 |

Do not invent owner contact or domain values — those stay in `ai/owner.md` until verified.
