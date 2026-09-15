# Current (read every session)

**Updated:** 2026-09-15T19:50Z  
**Product:** VARKA  
**Active phase:** Phase 2 next  
**Last task:** Lock **pnpm 12.4.2** + **Node >= 24** (fixed packageManager quote typo)  
**Next task:** Phase 2 content harden + Vercel green

## Tooling (locked)

- pnpm **12.4.2**
- Node **>= 24**
- eslint **10.10.0**

```bash
corepack enable && corepack prepare pnpm@12.4.2 --activate
```

## Snapshot

- Phase 0–1: done (source)
- Operator: reinstall with pnpm 12.4.2 and commit lockfile
