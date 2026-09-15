# VARKA Architecture

```
┌─────────────┐     public API      ┌──────────────────┐
│  Astro web  │ ←─────────────────→ │  Next.js admin   │
│  :4321 SSR  │   /api/public/*     │  :3000           │
└─────────────┘                     └────────┬─────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
              PostgreSQL                  Redis                    Disk/S3
              (Prisma 7)               (optional)                (media)
```

## Apps

| App | Package | Role |
|-----|---------|------|
| Admin | `@varka/admin` | Auth, CMS UI, APIs |
| Web | `@varka/web` | Public HTML-first SSR site |
| Worker | `@varka/worker-jobs` | Memory queue tick (process-local) |

## Packages

| Package | Role |
|---------|------|
| `database` | Prisma schema + client |
| `auth` | Better Auth factory, users |
| `permissions` | RBAC catalog + `requirePermission` |
| `content` | Posts, comments, public reads, cache invalidation |
| `media` | Local/S3 adapters |
| `themes` | 10 editorial themes + `getThemeCss` |
| `seo` / `i18n` | Meta, sitemap, URL helpers |
| `cache` / `queue` | Rate limit, cache, jobs |
| `security` | Headers, origin, audit |
| `markdown` | Markdown ↔ HTML helpers |

## Content model (simplified)

- `Post` + `PostTranslation` (per language slug/body/SEO)
- `Page` + translations
- `Category` / `Tag` + translations
- `MediaAsset`, `Comment`, `Revision`, `AuditLog`

## URL rules (locked)

- Default language (en): `/post/{slug}` (no locale prefix)
- Other languages: `/{urlPrefix}/post/{slug}` (e.g. `/pa/post/...`)

## Security baseline

- Session auth (Better Auth)
- Server-side RBAC
- Security headers via `proxy.ts`
- Origin check + rate limit on public comment POST
- Audit log for sensitive actions

## Performance

- Public posts/theme APIs: `s-maxage` + SWR
- In-process or Redis cache for published reads
- Astro SSR so new publishes appear without full static rebuild
