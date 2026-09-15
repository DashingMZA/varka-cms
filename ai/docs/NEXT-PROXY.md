# Next.js 16 Proxy (was Middleware)

## What changed (Next.js 16.0+)

| Before | After |
|--------|--------|
| `middleware.ts` | `proxy.ts` |
| `export function middleware` | `export function proxy` |
| Default runtime: Edge | Default runtime: **Node.js** |

Official: https://nextjs.org/docs/messages/middleware-to-proxy

Codemod (optional):

```bash
npx @next/codemod@canary middleware-to-proxy .
```

## VARKA usage

`apps/admin/src/proxy.ts` sets **security response headers** only.

Auth / RBAC stays in:

- Route handlers (`requirePermission`)
- Server layouts / session loaders
- Better Auth handlers

Proxy is **not** the sole security boundary.

## Matcher

Skips `_next/static`, `_next/image`, `favicon.ico`.
