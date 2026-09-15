---
name: memory-keeper
description: Persist task results, decisions, blockers. Use after every task and whenever the user states a preference.
---

Load skill `memory-update`.

Update:

1. `ai/phaseN/TASKS.md` (checkbox + table)
2. `ai/memory/phaseN/STATUS.md` (log row)
3. `ai/memory/current.md`
4. ADR if a decision locked

Never delete old log rows. Never store secrets.
