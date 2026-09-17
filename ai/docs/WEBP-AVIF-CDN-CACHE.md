# WebP vs AVIF & CDN caching headers (VARKA)

Research snapshot: 2026. Applies to media derivatives and `MEDIA_CDN_URL` / local file proxy.

---

## WebP vs AVIF

| Dimension | WebP | AVIF |
|-----------|------|------|
| **Typical size** (same visual quality) | ~25–35% smaller than JPEG | Often **15–35% smaller than WebP** on photos |
| **Browser coverage (global ~2026)** | ~97–99% | ~93–95% |
| **Encode speed** | Fast (libwebp) | **~5–20× slower** (libaom / similar) |
| **Alpha / animation** | Yes | Yes |
| **HDR / 10–12 bit** | No (lossy 8-bit) | Yes |
| **Lossless** | Strong, often smaller than AVIF lossless | Lossless can be **larger** than WebP |
| **sharp support** | Mature (`.webp()`) | Available (`.avif()`) but slower on upload path |

### Quality scale is not the same number

Rough visual equivalence (photos):

| Goal | JPEG q | WebP q | AVIF q |
|------|--------|--------|--------|
| Sharp web default | 85 | **80** | **~60** |
| Thumbnail | 75 | **75** | **~45–50** |
| Near-lossless | 95 | 90–95 | ~80 |

If you set AVIF q=80 thinking it matches WebP q=80, files are often **larger** and encode is slower. Calibrate AVIF lower.

### Recommendation for VARKA (admin CMS uploads)

1. **Keep current design:** original **unchanged** + derivatives as **WebP** (default).
   - Upload path must stay responsive; AVIF encode on every upload hurts UX.
2. **Optional later (Phase+):** generate **AVIF + WebP** for medium/large, serve via `<picture>` on the public Astro site:
   ```html
   <picture>
     <source type="image/avif" srcset="…-medium.avif" />
     <source type="image/webp" srcset="…-medium.webp" />
     <img src="…-medium.webp" alt="…" loading="lazy" decoding="async" />
   </picture>
   ```
3. **Single-format fallback:** WebP only is still correct for ~all modern browsers.
4. Env already present: `MEDIA_WEBP_QUALITY_THUMB`, `MEDIA_WEBP_QUALITY`.

---

## CDN caching headers

### Content-addressed media (VARKA keys: `YYYY/MM/{id}-name-size.webp`)

URL changes when the object is new → safe to treat as immutable:

```http
Cache-Control: public, max-age=31536000, immutable
ETag: "<sha1-of-body>"
```

Already used on local `/api/media/file/…` with **304** on `If-None-Match`.

| Directive | Role |
|-----------|------|
| `public` | Browser + shared caches (CDN) may store |
| `max-age=31536000` | 1 year freshness |
| `immutable` | Browser skip revalidation on reload (URL must never change for same content) |
| `ETag` | Cheap revalidation if a proxy ignores `immutable` |

### Split browser vs CDN TTL

When origin and edge need different lifetimes:

```http
Cache-Control: public, max-age=86400
CDN-Cache-Control: max-age=604800
# Cloudflare-specific:
Cloudflare-CDN-Cache-Control: max-age=2592000
```

- `Cache-Control` → browsers / generic intermediaries  
- `CDN-Cache-Control` / `Cloudflare-CDN-Cache-Control` → edge only  

`s-maxage` also targets shared caches only (older, still widely used):

```http
Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800
```

### R2 + Cloudflare custom domain

1. Attach **custom domain** to the bucket (public read).
2. Prefer **Tiered cache** so edges miss to upper tier before R2.
3. Cache Rules: cache `image/*`, respect origin `Cache-Control` or force long TTL for `/YYYY/MM/*`.
4. Set `MEDIA_CDN_URL=https://cdn.example.com` so app URLs hit the edge, not the admin origin.

### What not to do

- `immutable` on **mutable** URLs (same path rewritten) → users stuck with old bytes.
- Caching HTML/API the same as images (`no-store` / short `max-age` for HTML).
- Relying only on `Expires` without `Cache-Control`.
- Forgetting that Cloudflare may **strip or weaken** poorly formatted ETags (use quoted strong tags: `ETag: "abc"`).

### Practical matrix for VARKA

| Asset | Headers |
|-------|---------|
| Derivative WebP/AVIF under hashed path | `public, max-age=31536000, immutable` + ETag |
| Original under same path scheme | same |
| Admin HTML / RSC | short or `private` / no long shared cache |
| Public Astro HTML | `s-maxage` short + `stale-while-revalidate` optional |
| Comment/API JSON | `private` or short `max-age` + auth awareness |

---

## References (industry 2026)

- AVIF often smaller than WebP at matched quality; WebP wins encode speed and slightly broader support.
- Cloudflare: origin `Cache-Control`, `CDN-Cache-Control`, R2 custom domains + cache rules.
