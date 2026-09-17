# CSP nonces & rate-limit storage

**Updated:** 2026-09-18

## CSP nonces (Next.js App Router)

### Why nonces
`'unsafe-inline'` for scripts weakens XSS defense. A per-request nonce lets the browser run only scripts that carry that nonce.

### How VARKA implements it
1. `generateCspNonce()` in `@varka/security`
2. `apps/admin/src/proxy.ts` — strip inbound CSP, set request + response CSP, `x-nonce`
3. Env: `CSP_NONCE_ENABLED`, `CSP_REPORT_ONLY`, `CSP_ALLOW_UNSAFE_EVAL`

### Caveats
- Next.js **≥ 16.2.5** recommended (GHSA-ffhc-5mcf-pf4q)
- Nonce HTML needs **dynamic** rendering
- Styles may still use `'unsafe-inline'`

### Rollout
1. `CSP_REPORT_ONLY=true`
2. Fix violations
3. Enforce

## Rate-limit storage

| Store | Latency | Multi-instance | When |
|-------|---------|----------------|------|
| Memory | &lt;1ms | No | Dev only |
| Redis | 1–5ms | Yes | Production multi-replica |
| PostgreSQL | 5–10ms | Yes | No Redis; moderate traffic |

**VARKA:** Redis when available (`REDIS_URL`); memory fallback for single process. Never memory-only behind a load balancer.

Env: `REDIS_URL`, `CACHE_DRIVER`, `AUTH_LOGIN_RATE_LIMIT`, `AUTH_LOGIN_WINDOW_SEC`
