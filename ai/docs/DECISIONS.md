# Architecture decision records — VARKA

## ADR-0001 — Plan-first, then phase execution

**Date:** 2026-09-14  
**Status:** accepted

Implement only after user starts a phase. Memory updated after every task.

## ADR-0002 — Next 16.3.5 + Astro 7.3 + Prisma 7.10

**Date:** 2026-09-14  
**Status:** accepted  
**Research:** npm + official sources, 2026-09-14

- Next.js **16.3.5** stable (16.4 is canary)
- Astro **7.3.2**
- Prisma npm `latest` may be **8.0.0-rc.*** — lock **7.10.x** (`prev` line)

## ADR-0003 — Better Auth

**Date:** 2026-09-14  
**Status:** accepted

Use Better Auth for admin auth. Email/password + Google + GitHub in V1.

## ADR-0004 — pnpm 11.27.0

**Date:** 2026-09-14  
**Status:** accepted

## ADR-0005 — Postgres is the content source of truth

**Date:** 2026-09-14  
**Status:** accepted

Markdown/RSS/sitemap/search/cache are derived.

## ADR-0006 — Product name VARKA

**Date:** 2026-09-14  
**Status:** accepted

Canonical name **VARKA**. Identity lives in `ai/owner.md`. Unknown owner fields stay "Not yet verified."

## ADR-0007 — User locks (URLs, Punjabi, auth, media, themes, admin host)

**Date:** 2026-09-14  
**Status:** accepted

See `ai/memory/project.md` D09, D11–D20.
