---
name: vibe-phase-runner
description: Start or continue a CMS phase. Read phase README/TASKS, pick the next pending task, refuse to skip gates. Use when user says start phase N or next task.
---

# Phase runner

## Steps

1. Read `ai/memory/current.md`. If user named a phase, switch `current.md` active phase **only if** dependencies are `done` (or user overrides).
2. Read `ai/phaseN/README.md` and `TASKS.md`.
3. Pick the first `pending` task. Mark `in-progress`.
4. Load the module README under `ai/phaseN/modules/<slug>/`.
5. Load matching agent + skills (`secure-build` for mutations, `research-stack` before installs).
6. Implement **that task**.
7. Run `cms-quality-gates` at task scope.
8. `memory-update`.

## Refusals

- “Just do all of phase 5” → still one task at a time unless they are independent and listed as parallel.
- Starting phase N+1 while N gates are red → stop.
- Unlocked decision in `project.md` that the task needs → ask, or apply recommended defaults if user allowed.
