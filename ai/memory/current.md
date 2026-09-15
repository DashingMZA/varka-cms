# Current (read every session)

**Updated:** 2026-09-15T19:15Z  
**Product:** VARKA  
**Mode:** fix-forward — make admin deploy + phase gaps real  
**Active phase:** Phase 0–1 verification (Vercel build)  
**Last task:** TS/build fixes + themes registry; STATUS.md truth audit  
**Next task:** Green Vercel deploy; wire real session AuthZ on admin APIs

## Snapshot

- Repo: `zuhanzaheer/varka` `main`
- Scaffold for phases 0–12 exists; **not all verified**
- See `ai/memory/STATUS.md` for honest matrix
- Recent: theme export fix, TS build fixes, `postinstall` prisma generate

## Open blockers

1. Vercel admin green build (operator redeploy latest `main`)
2. `DATABASE_URL` + `AUTH_SECRET` on Vercel
3. DB migrate + seed against production Postgres
4. Replace `dev-user` API context with Better Auth session

## Notes

- Do not invent owner contact values (`ai/owner.md`)
- Claude/Grok share this memory protocol
