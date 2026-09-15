# Phase 2: Content Core

**Status:** `in-progress`  
**Depends on:** phase 1  
**Goal:** Posts, pages, taxonomies, revisions, publish workflow, admin CRUD.

## Delivered (source)

- Prisma models: Post, PostTranslation, Page, PageTranslation, Category, Tag, AuthorProfile, Revision, Comment
- `@varka/content`: slug helpers, create/list/update/publish post services, HTML sanitization, optimistic versioning
- Admin: `/content/posts` list + create, `/content/posts/[id]` editor
- API: `GET/POST /api/posts`, `GET/PATCH /api/posts/[id]`

## Local verify

```bash
pnpm db:generate
# schema already pushable via prisma db push
pnpm --filter @varka/admin dev
# open /content/posts
```
