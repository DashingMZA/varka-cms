/**
 * CDN / browser caching for media binaries.
 * Images: long-lived immutable when keyed by content-addressed path.
 * Do NOT Brotli/gzip recompress JPEG/WebP/PNG — already compressed.
 */

export type MediaCacheOpts = {
  /** When true, use immutable year-long cache (versioned keys). */
  immutable?: boolean;
  /** Override max-age seconds */
  maxAge?: number;
};

export function mediaCacheControl(opts?: MediaCacheOpts): string {
  const maxAge = opts?.maxAge ?? Number(process.env.MEDIA_CACHE_MAX_AGE ?? 31536000);
  if (opts?.immutable !== false) {
    return `public, max-age=${maxAge}, immutable`;
  }
  return `public, max-age=${maxAge}, stale-while-revalidate=86400`;
}

export function mediaResponseHeaders(contentType: string, opts?: MediaCacheOpts): Record<string, string> {
  return {
    'Content-Type': contentType,
    'Cache-Control': mediaCacheControl(opts),
    'X-Content-Type-Options': 'nosniff',
    // Allow public site (Astro) to load admin-served media when same deployment / CDN
    'Cross-Origin-Resource-Policy': process.env.MEDIA_CORP ?? 'cross-origin',
  };
}
