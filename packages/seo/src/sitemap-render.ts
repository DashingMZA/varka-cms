/**
 * Sitemap XML renderers.
 *
 * Ported from BMS-CMS (src/lib/sitemap.ts), adapted to be framework-agnostic.
 * Takes URLs as input instead of querying the database directly.
 */

export const SITEMAP_KINDS = ['post', 'page', 'category', 'tag', 'author'] as const;
export type SitemapKind = (typeof SITEMAP_KINDS)[number];

export interface SitemapUrl {
  loc: string;
  lastmod?: Date | string | null;
  images?: string[];
}

/**
 * URLs per child file. Google rejects a sitemap past 50,000 URLs (or 50 MB);
 * 10,000 keeps each file well inside both and quick to generate.
 */
export const MAX_PER_SITEMAP = 10_000;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * A URL as a `<loc>` is allowed to contain it.
 *
 * The sitemap protocol requires the URL itself to be percent-encoded.
 * Order matters: percent-encode first, then XML-escape.
 */
function locValue(url: string): string {
  try {
    return esc(encodeURI(decodeURI(url)));
  } catch {
    return esc(encodeURI(url));
  }
}

const iso = (d?: Date | string | null) => (d ? new Date(d).toISOString() : undefined);

/** Where part `n` of a kind's sitemap lives. Part 1 keeps the classic name. */
export function sitemapPartPath(kind: SitemapKind, n: number): string {
  if (n <= 1) return `/sitemap-${kind}.xml`;
  return `/sitemap-${kind}-${n}.xml`;
}

const STYLESHEET = (base: string) =>
  `<?xml-stylesheet type="text/xsl" href="${esc(base)}/sitemap.xsl"?>`;

/**
 * Render a `<urlset>` for one child sitemap.
 */
export function renderUrlset(urls: SitemapUrl[], base: string): string {
  const hasImages = urls.some((u) => u.images?.length);
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    STYLESHEET(base),
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasImages ? ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` : ''}>`,
  ];
  for (const u of urls) {
    lines.push(`<url><loc>${locValue(u.loc)}</loc>`);
    const mod = iso(u.lastmod);
    if (mod) lines.push(`<lastmod>${mod}</lastmod>`);
    for (const img of u.images ?? []) lines.push(`<image:image><image:loc>${locValue(img)}</image:loc></image:image>`);
    lines.push(`</url>`);
  }
  lines.push(`</urlset>`);
  return lines.join('\n');
}

/**
 * Render a sitemap index.
 *
 * Each child is listed with the newest date it contains, and a child with
 * nothing in it is left out — an index entry that opens to an empty file
 * reads as a broken site.
 */
export function renderSitemapIndex(
  children: { kind: SitemapKind; urls: SitemapUrl[] }[],
  base: string,
): string {
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    STYLESHEET(base),
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ];
  for (const { kind, urls } of children) {
    if (urls.length === 0) continue;
    // One entry per part, each dated by the newest URL it holds.
    for (let part = 1; (part - 1) * MAX_PER_SITEMAP < urls.length; part++) {
      let newest: Date | null = null;
      for (const u of urls.slice((part - 1) * MAX_PER_SITEMAP, part * MAX_PER_SITEMAP)) {
        if (u.lastmod && (!newest || new Date(u.lastmod) > newest)) newest = new Date(u.lastmod);
      }
      lines.push(
        `<sitemap><loc>${locValue(`${base}${sitemapPartPath(kind, part)}`)}</loc>${newest ? `<lastmod>${newest.toISOString()}</lastmod>` : ''}</sitemap>`,
      );
    }
  }
  lines.push(`</sitemapindex>`);
  return lines.join('\n');
}

export const SITEMAP_CONTENT_TYPE = 'application/xml; charset=utf-8';
