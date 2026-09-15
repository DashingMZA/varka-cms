# Phase 11: Ten Themes + CI

## Themes (all under shared contract)

| ID | Name |
|----|------|
| theme-01 | Clean Editorial |
| theme-02 | Dark Editorial |
| theme-03 | Forest Editorial |
| theme-04 | Ocean Editorial |
| theme-05 | Sand Editorial |
| theme-06 | Midnight Mono |
| theme-07 | Rose Paper |
| theme-08 | Slate Magazine |
| theme-09 | High Contrast |
| theme-10 | Aurora Dark |

## CI

`.github/workflows/ci.yml` — install, package unit tests, compose config validate.

```bash
pnpm --filter @varka/themes test
```
