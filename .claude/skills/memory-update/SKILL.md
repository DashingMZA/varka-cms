---
name: memory-update
description: Persist task completion, blockers, and decisions into ai/memory. Use after every task, every phase, every user preference, every ADR.
---

# Memory update

Run at the end of a task (done, blocked, or skipped with reason). Also run when a phase is accepted.

Product name is **VARKA**. Identity fields come from `ai/owner.md` — never invent contacts or domains.

## Writes (every task)

1. `ai/phaseN/TASKS.md` — checkbox and table `Status` column
2. `ai/memory/phaseN/STATUS.md` — new log row (append, never delete)
3. `ai/memory/phaseN/tasks/{task-id}.md` — full card copied from `ai/memory/TEMPLATE-TASK.md`
4. `ai/memory/current.md` — lastTask, next task, blockers
5. If decision: `ai/memory/project.md` + `ai/docs/DECISIONS.md` + `ai/memory/decisions.md`

## Writes (phase accepted)

6. `ai/memory/phaseN/COMPLETE.md` from `ai/memory/TEMPLATE-PHASE.md`
7. Phase `README.md` Status → `done`
8. `current.md` points at the next phase

## Log row

```
| ISO-8601 | task-id | done|blocked|in-progress | one-line fact |
```

Include gate results factually in both the STATUS notes and the task card:

```
pnpm typecheck: PASS
pnpm test: 12 passed
pnpm build: not run (task-scoped)
```

## Never

- Delete previous rows
- Store secrets
- Mark `done` without gates for that task
- Skip the task card
- Invent `ai/owner.md` fields
