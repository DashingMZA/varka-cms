# Web deployment fix (varka-blog) — 2026-10-05

## Ask
User: "ab web ko b dekh lo wo deploy ni ho rhe vercl pe wo he same error" —
the varka-blog Vercel project kept failing to build.

## Investigation
- The old `varka-auth` project no longer exists; the web project is now
  `varka-blog` (prj_RlIVBIfOWHRpIibFZHbnfCorEqCr).
- Root cause 1: repo-root `vercel.json` build command
  (`pnpm db:generate && pnpm --filter @varka/admin build`) was applied to the
  web project (Root Directory = apps/web) → `db:generate` not found + wrong
  workspace built. Fixed with scoped `apps/web/vercel.json` (commit f9b07b2):
  `cd ../.. && pnpm db:generate && pnpm --filter @varka/web build`.
- Root cause 2 (from live build log via browser task): `astro build` failed with
  `[MISSING_EXPORT] "applyPolyfills" is not exported by astro@7.3.2/dist/core/app/node.js`,
  imported by `@astrojs/vercel@9.0.5`. Astro 7 dropped the `applyPolyfills`
  export; `@astrojs/vercel@11.x` targets `astro ^7` and doesn't use it.
  Fixed by upgrading `@astrojs/vercel` ^9.0.0 → ^11.0.11 (commit b5e3ede).
  (Local build had passed only because ADAPTER wasn't set → Node adapter used.)
- Root cause 3: Vercel install failed with `ERR_PNPM_OUTDATED_LOCKFILE`
  (package.json changed without lockfile). The 270KB lockfile couldn't be pushed
  via the github MCP CLI (argument list too long). Fixed instead with
  `pnpm install --no-frozen-lockfile` in apps/web/vercel.json so Vercel
  resolves fresh (commit d2b6aef).

## Result
- Deployment dpl_GtKUsAJFfo2X (commit d2b6aef) is READY.
- https://varka-blog.vercel.app/ returns HTTP 200, Celebrtiy theme rendering.

## Follow-ups
- The regenerated pnpm-lock.yaml (with @astrojs/vercel 11) was never pushed
  (too large for the MCP CLI). It lives only in Vercel's build. Next time
  someone runs `pnpm install` locally from a fresh clone, the lockfile will
  update itself — or push it via a method that handles large files.
- Consider pinning the lockfile properly once local pnpm is available.
