# VARKA AI / Agent workspace

This tree is the **source of truth for agents** (Claude, Grok, and others).

| Path | Purpose |
|------|---------|
| `owner.md` | Product identity — do not invent fields |
| `memory/current.md` | Active phase, blockers, next task |
| `memory/phaseN/` | Per-phase status + task cards |
| `phaseN/` | Phase README, TASKS, ACCEPTANCE, COMPLETE |
| `docs/` | STACK, STRUCTURE, DECISIONS, ARCHITECTURE |
| `AGENTS.md` | Agent roster + responsibilities |

Root agent configs:

- `CLAUDE.md` — Claude session bootstrap
- `.claude/agents/` — Claude agent definitions
- `.claude/skills/` — Claude skills
- `.grok/` — Grok session bootstrap + skills
