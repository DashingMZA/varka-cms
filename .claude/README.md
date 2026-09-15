# .claude/

Claude Code (and compatible agents) load these automatically.

```
.claude/
  agents/     specialized personas — invoke by name
  skills/     procedures — load when the task matches the description
```

## Agents

| Agent | Use when |
|---|---|
| `architect` | Cross-cutting design, ADRs, phase boundaries |
| `backend` | Prisma, services, jobs, APIs |
| `admin-ui` | Next.js admin screens |
| `frontend-astro` | Public Astro + themes |
| `theme-engine` | Theme contract + the 10 packs |
| `security` | AuthZ, XSS, uploads, headers |
| `seo` | Canonical, sitemap, robots, JSON-LD |
| `i18n` | Languages, RTL, hreflang |
| `qa` | Tests, Playwright, quality gates |
| `devops` | Env, CI, deploy, workers |
| `researcher` | Live version / docs lookup before install |
| `memory-keeper` | Persist task outcomes |

## Skills

| Skill | Use when |
|---|---|
| `diagram-design` | Any architecture/ER/flow diagram |
| `vibe-phase-runner` | Starting or continuing a phase |
| `memory-update` | Task done / blocked |
| `cms-quality-gates` | End of task or phase |
| `secure-build` | Any mutation, upload, HTML, fetch |
| `research-stack` | Installing or bumping a dependency |
| `seo-first` | Public pages, metadata, XML |
| `theme-contract` | Theme work |
| `i18n-rtl` | Languages, translations, dir |
| `content-workflow` | Posts/pages publish, autosave, revisions |

## Invoke examples

```
Use agent architect + skill vibe-phase-runner. Start phase 0 task 0.1.
Use skill memory-update. Task 2.4 done. Notes: …
Use skill diagram-design. Architecture of publish transaction.
Use agent researcher + skill research-stack. Confirm Prisma 7 latest patch.
```
