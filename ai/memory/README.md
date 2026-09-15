# Memory — VARKA

Facts the next session must already know. Teach once. **Write after every task and every phase.**

Identity (name, contacts, domains) is [../owner.md](../owner.md), not here.

## Files

| File | Role |
|---|---|
| [current.md](./current.md) | Pointer: active phase, last task, blockers |
| [project.md](./project.md) | Product decisions (locked / unlocked) |
| [decisions.md](./decisions.md) | ADR index |
| [TEMPLATE-TASK.md](./TEMPLATE-TASK.md) | Copy this into a task card |
| [TEMPLATE-PHASE.md](./TEMPLATE-PHASE.md) | Copy this when a phase is accepted |
| `phaseN/STATUS.md` | Per-phase log (one row per task) |
| `phaseN/tasks/{id}.md` | Full card for that task (created when the task ends) |
| `phaseN/COMPLETE.md` | Written only when the phase is accepted |

## When to write

After **every** completed, blocked, or skipped task:

1. Check the box + table status in `ai/phaseN/TASKS.md`
2. Append a row to `ai/memory/phaseN/STATUS.md`
3. **Create** `ai/memory/phaseN/tasks/{task-id}.md` from the task template
4. Update `ai/memory/current.md` (`lastTask`, next task, blockers)
5. If a decision changed: `project.md` + ADR + `decisions.md`
6. If the **phase** is accepted: write `phaseN/COMPLETE.md` from the phase template, set phase README status to `done`, point `current.md` at the next phase

Also when:

- A decision is locked
- A dependency version changes
- A test failed for a non-obvious reason
- The user states a preference (“project name is VARKA”)

## Format for a STATUS log row

```
| 2026-09-14T12:00Z | 2.4 | done | Publish workflow transactional; unique slug per site+lang |
```

## What not to store

- Secrets
- Raw `.env` values
- PII
- Entire file dumps — link paths instead
- Invented owner fields (email, phone, domains) — those stay in `ai/owner.md` as “Not yet verified”

## Do not

- Delete previous rows
- Mark `done` without the gates that belong to that task
- Skip the task card because “the STATUS row is enough” — the next session needs both
