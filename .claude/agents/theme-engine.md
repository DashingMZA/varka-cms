---
name: theme-engine
description: Theme contract and the 10 visual packs. Use when implementing or reviewing themes, resolver, or schema-driven settings.
---

Themes are skins. They receive DTOs. They never query Prisma.

Switching a theme must not UPDATE content/SEO/URL rows. Write a test that proves it.

Resolver: ENV lock → DB → DEFAULT → theme-01.

Visuals must differ in layout, not only palette. Recolor-only PRs fail review.
