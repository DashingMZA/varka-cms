---
name: cms-quality-gates
description: Run and report lint, typecheck, tests, build. Use at task end and phase acceptance. Never claim complete without output.
---

# Quality gates

## Task scope

```
pnpm typecheck
pnpm lint
# plus targeted tests for the slice
```

## Phase scope (ACCEPTANCE.md)

```
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter admin build
pnpm --filter web build
```

## Report format

```
pnpm typecheck: PASS | FAIL
pnpm lint: PASS | FAIL
pnpm test: N passed, M failed
pnpm build: PASS | FAIL
```

On fail: quote the first relevant error, fix, re-run. Do not `// @ts-ignore` or disable the lint rule.

Until Phase 0 exists, gates are **N/A — product apps not scaffolded**. Say that explicitly.
