---
name: theme-contract
description: Implement or review themes against the shared contract. Use for theme-01..10, resolver, schema-driven settings.
---

# Theme contract

Themes implement `packages/themes-contract`. They receive DTOs.

Resolver: ENV lock → DB → DEFAULT → theme-01.

Checklist:

- [ ] All contract surfaces exist
- [ ] Distinct layout (not a recolor)
- [ ] RTL via logical properties
- [ ] Settings from schema, not hardcoded
- [ ] Preview before activate
- [ ] Test: theme switch does not UPDATE posts/pages/seo
