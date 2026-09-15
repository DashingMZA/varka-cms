---
name: phase-workflow
description: How to execute a VARKA phase incrementally with gates
---

# Phase workflow

1. Read `ai/memory/current.md` and `ai/phaseN/README.md` + `TASKS.md`
2. Pick the next `pending` task
3. Implement the smallest vertical slice
4. Run available gates (test/typecheck/build) for that slice
5. Run **memory-update** skill
6. Report: implemented / tested / passed / failed / remaining / next

Do not skip to a later phase while foundational blockers remain unless documented as non-blocking.
