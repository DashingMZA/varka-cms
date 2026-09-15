---
name: diagram-design
description: Create branded architecture, flowchart, sequence, ER, timeline, swimlane, layer-stack, state, tree, and data-flow diagrams as standalone HTML+SVG. No Mermaid slop in the output file. Use for CMS architecture, phase maps, publish flows, RBAC, theme contract.
license: MIT
metadata:
  version: "2.6-local"
  upstream: "https://github.com/cathrynlavery/diagram-design"
---

# Diagram Design (project copy)

Upstream: [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) v2.6. This folder is a **self-contained subset** so agents can draw without the full marketplace plugin. If the full skill is installed, prefer it.

## Output

One self-contained HTML file in `ai/docs/diagrams/<slug>.html`:

- Inline CSS + inline SVG
- Google Fonts allowed: Instrument Serif, Geist, Geist Mono
- `svg[role=img]` + `aria-labelledby` + `<title>` + `<desc>`
- Static by default
- No shadows, no Mermaid renderer, no diagonal arrows (rounded right-angles r=8)
- 4px grid; density 4/10; max ~9 nodes or split
- Accent on **1–2** focal nodes only

## Tokens

Read `references/style-guide.md`. This project uses **Editorial CMS** tokens (not the upstream tangerine default).

## Type picker

| Showing | Type |
|---|---|
| Apps + data stores | architecture |
| Task / module order | flowchart |
| Request across admin/web/db | sequence |
| Tables | ER / database schema |
| Phases over time | timeline |
| RBAC / layers | layer stack |
| Post statuses | state machine |
| Monorepo | tree |
| Publish invalidation | data flow |

## Workflow

1. Style guide already customized for this repo — skip the onboard gate unless the user asks to rebrand.
2. State type + filename in one line.
3. Draw SVG on 4px grid. Connectors: rounded orthogonal, labels with mask rect, no overlaps.
4. Write HTML. Link it from `ai/docs/diagrams/README.md` and the phase `DIAGRAM.md`.

## Anti-patterns

Dark-mode neon, shadows, identical boxes, coral on every node, Mermaid layout, vertical text on arrows, legend inside the plot.

## If full upstream is available

Follow upstream SKILL.md + `references/type-*.md` exactly. Still emit into `ai/docs/diagrams/`.
