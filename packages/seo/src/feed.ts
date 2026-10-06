/**
 * RSS feed generator.
 *
 * Ported from BMS-CMS (src/lib/feed.ts), adapted to be framework-agnostic.
 * Takes posts as input instead of querying the database directly.
 */

export interface FeedPost {
  title: string;
  slug: string;
  /** Absolute URL of the post */
  url: string;
  excerpt?: string | null;
  /** Plain text fallback for description */
  text?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface FeedOptions {
  title: string;
  description?: string;
  /** Absolute base URL */
  base: string;
  /** Language code, e.g. 'en' */
  language: string;
  /** Absolute URL of the feed itself */
  feedUrl: string;
  /** Absolute URL of the site/channel */
  siteUrl: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * A URL as the feed writes it: percent-encoded and XML-escaped.
 */
function feedUrl(url: string): string {
  try {
    return escapeXml(encodeURI(decodeURI(url)));
  } catch {
    return escapeXml(encodeURI(url));
  }
}

/**
 * Build an RSS 2.0 feed.
 *
 * Most posts have no excerpt, and an <item> with no <description> shows
 * readers a bare title. The body's first sentences stand in, cut at a word.
 */
export function buildRssFeed(posts: FeedPost[], options: FeedOptions): string {
  const { title, description = '', base, language, feedUrl: selfUrl, siteUrl } = options;

  const summary = (p: FeedPost): string => {
    const own = (p.excerpt ?? '').trim();
    if (own) return own;
    const text = (p.text ?? '').replace(/\s+/g, ' ').trim();
    if (text.length <= 300) return text;
    const cut = text.slice(0, 300);
    return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 200))}…`;
  };

  const itemsXml = posts
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${feedUrl(p.url)}</link>
      <guid isPermaLink="true">${feedUrl(p.url)}</guid>
      ${summary(p) ? `<description>${escapeXml(summary(p))}</description>` : ''}
      ${summary(p) ? `<content:encoded><![CDATA[<p>${escapeXml(summary(p)).replace(/\]\]>/g, ']]&gt;')}</p>]]></content:encoded>` : ''}
      ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ''}
    </item>`,
    )
    .join('');

  // When the feed last changed: the newest publish or edit among its items.
  const lastBuilt = posts.reduce<number>((max, p) => {
    for (const d of [p.updatedAt, p.publishedAt]) {
      if (d) max = Math.max(max, new Date(d).getTime());
    }
    return max;
  }, 0);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${feedUrl(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
    <language>${escapeXml(language)}</language>
    ${lastBuilt ? `<lastBuildDate>${new Date(lastBuilt).toUTCString()}</lastBuildDate>` : ''}
    <atom:link href="${feedUrl(selfUrl)}" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;
}

export const RSS_CONTENT_TYPE = 'application/rss+xml; charset=utf-8';
