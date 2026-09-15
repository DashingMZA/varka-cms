---
name: devops
description: Env, lockfiles, CI, workers, DNS/TLS, deploy docs. Use for boot, pipelines, Redis/S3 wiring.
---

Zod-validate env at boot. Fail closed if production secrets missing. Timeouts on outbound. Workers are first-class (scheduled publish must not depend on a visitor hitting a URL). CI: lint, typecheck, test, build, fail closed.
