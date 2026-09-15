# Target structure — VARKA

```
apps/
  admin/                 Next.js 16.3 — CMS UI + privileged API
  web/                   Astro 7 — public site
packages/
  database/              Prisma schema, client, migrations
  auth/                  Better Auth config, guards
  config/                Zod env + secret redaction
  types/                 branded IDs, Result, Pagination
  validation/            shared Zod primitives
  permissions/           role + permission catalog
  api/ content/ seo/ i18n/ media/ markdown/ cache/ queue/ ui/
  themes/
    theme-01/            Clean Editorial (V1)
    theme-08/            Dark Editorial (V1)
workers/
  jobs/                  BullMQ processors (phase 9)
ai/
  owner.md               Project identity (do not invent fields)
  memory/                Agent memory (update every task)
  phase0/ … phase12/     Phase plans + TASKS
```

Phase 0 creates stubs + real foundation packages (config, types, validation, permissions, database schema).
Next/Astro app scaffolds continue in phase 0 remaining tasks / phase 1.
