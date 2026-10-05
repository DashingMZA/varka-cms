# Theme-11 "Celebrtiy" (Celebrtiy Kadence replica)

- **Date:** 2026-10-04
- **Ask:** Create theme-11 in `packages/themes` — a replica look of the WordPress/Kadence celebrity-biography blog celebrtiy.com, with exact CSS class names a sibling agent's Astro templates will build against.

## Changes

- `packages/themes/src/theme-11/manifest.ts` — new; `theme11: ThemeManifest` with id `theme-11`, name `Celebrtiy Kadence`, version `1.0.0`, supports `{ rtl: false, darkMode: false }`, tokens (bg `#efeff5`, ink `#040037`, accent `#E21E51`, muted `#666699`, card `#f8f9fa`, border `#deddeb`, fontSans = fontSerif = Overpass stack), templates `['home','post','page','category','tag','author','search','404']`.
- `packages/themes/src/theme-11/styles.css.ts` — new; exports `theme11Css` template string (ends `.trim()`, imports `theme11` from `./manifest` for tokens, mirroring theme-10). Defines `:root` vars (`--varka-bg/ink/accent/muted/card/border/font-sans` plus extras `--varka-body #032075`, `--varka-nav #290342`, `--varka-blue #4d40ff`, `--varka-footer-border #3e3063`, `--varka-btn-grad-1 #8920f3`, `--varka-btn-grad-2 #ff7c58`, `--varka-shadow`), body reset (Overpass 18px/1.6), and all required `celebrtiy-*` component classes: container, header/inner/logo/nav/link/search-btn, search drawer + form, hero band + breadcrumbs (`»` separators via `.sep`) + hero title, featured grid (1 large + 4 small, 1.4fr/1fr × 2 rows, stacks at 640px), card suite (media/body/cat/title/meta/excerpt/link with "Continue Reading →"), section/title/cat-links pill buttons, card-row (4→2→1 cols), cat-block, tabs + active tab + horizontal scroll-snap carousel, more-info, article layout (1fr/320px → stacked) + article card, prose (accent pink/red bar `h2`, 24px `h3`, responsive rounded imgs, spaced lists, accent links), sidebar picks (84px thumb + title), similar, dark-navy footer with 4px top border, footer nav, social icon circles, centered copyright, gradient pill button (43deg #8920f3 → #ff7c58), pagination, author box. Breakpoints 1024px and 640px (nav becomes horizontal scroll on mobile).
- `packages/themes/src/registry.ts` — imported `theme11`, added to `MANIFESTS`, added `case 'theme-11': return (await import('./theme-11/styles.css')).theme11Css;` in `getThemeCss` (path without `.ts` per Turbopack convention).
- `packages/themes/src/index.ts` — exported `theme11`.
- `packages/themes/src/registry.test.ts` — 10 → 11: "has eleven themes", `isThemeId('theme-11')` check, unique ids `theme-01..theme-11`, `Array.from({ length: 11 }, ...)`.
- Gates: `pnpm --filter @varka/themes test` (node:test) and `typecheck` run after `pnpm install` completed.

## Skills used

- None directly (no admin-dashboard work this task; no Prisma/schema changes). Followed `AGENTS.md` run/test conventions and the per-task memory log rule.

## Follow-ups

- A sibling agent builds Astro templates against the `celebrtiy-*` class names in `theme11Css`; class names must stay stable.
- Do not edit `.claude/memory/tasks/README.md` for this task — the coordinator updates it.

## Coordinator verification & fixes (2026-10-04)
- Agent's result delivery failed (runtime drain) but all files were complete; verified directly.
- `pnpm --filter @varka/themes test`: 5/5 pass. `typecheck`: clean.
- Fixed pre-existing `toSorted` lib-target error by bumping `tsconfig.base.json` lib ES2022 → ES2023 (repo lint rule `unicorn/no-array-sort` mandates `toSorted`; additive, safe).
