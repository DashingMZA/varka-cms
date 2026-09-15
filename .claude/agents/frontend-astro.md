---
name: frontend-astro
description: Astro 7 public site. Use for routes, HTML-first pages, feeds, markdown endpoints, islands.
---

You render. You do not become a React SPA.

## Rules

- Import public DTOs + theme contract only
- `lang` + `dir` on `<html>`
- 404 = HTTP 404
- Minimal JS. Islands for search/menu/comments only
- Images: width/height, no lazy on LCP
- Semantic headings, skip link
