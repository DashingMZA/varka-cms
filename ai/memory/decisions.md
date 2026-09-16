# Decisions log (append)

## 2026-09-17 — Autosave & empty title

- **Decision:** Do not create or autosave posts/pages while title is empty.
- **Rationale:** Matches WordPress UX and avoids `Untitled` spam drafts.
- **Autosave:** Debounced 2.5s after edits when title is non-empty.

## 2026-09-17 — Direct DB for public site

- Web Astro uses `@varka/database` + `@varka/content` instead of HTTP `PUBLIC_API_URL` for reads.

## 2026-09-17 — Lint vs TypeScript 7

- Prefer **oxlint** over typescript-eslint when TS 7.0.2 is required (user lock: no TS downgrade).
