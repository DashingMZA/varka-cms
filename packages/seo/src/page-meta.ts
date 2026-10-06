/**
 * Meta tag builder — title, description, canonical, Open Graph, Twitter.
 *
 * Ported from BMS-CMS (src/lib/seoMeta.ts), adapted to be framework-agnostic.
 * Returns plain objects that any framework (Next.js, Astro) can consume.
 */

import { ogLocale, twitterHandle } from './templates.js';

export interface PageMetaInput {
  /** Site name */
  siteName?: string;
  /** Site tagline/description */
  siteDescription?: string;
  /** Language code (e.g. 'en', 'ur') */
  language: string;
  /** Site-relative path, e.g. `/my-post` */
  path: string;
  /** Absolute base URL, e.g. `https://example.com` */
  base: string;
  title: string;
  description?: string | null;
  /** `website` for roots and listings, `article` for a post. */
  type?: 'website' | 'article';
  images?: string[];
  /** Set only when the author has overridden it; otherwise self-canonical. */
  canonicalOverride?: string | null;
  /** Article-only. */
  publishedTime?: string;
  modifiedTime?: string;
  /** Twitter card style */
  twitterCard?: 'summary' | 'summary_large_image';
  /** Site's X/Twitter handle */
  twitterSite?: string;
  /** Author's X/Twitter handle */
  twitterCreator?: string;
}

export interface BuiltMeta {
  title: string;
  description?: string;
  canonical: string;
  openGraph: {
    title: string;
    description?: string;
    url: string;
    siteName?: string;
    locale: string;
    type: 'website' | 'article';
    images: { url: string }[];
    publishedTime?: string;
    modifiedTime?: string;
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description?: string;
    images: string[];
    site?: string;
    creator?: string;
  };
}

/**
 * Title, description, canonical, Open Graph, Twitter.
 *
 * The canonical is **self-referencing by default**. A page with no canonical at
 * all leaves a crawler to decide which URL is the real one.
 */
export function buildPageMeta(input: PageMetaInput): BuiltMeta {
  const {
    siteName,
    language,
    path,
    base,
    title,
    type = 'website',
    images = [],
    canonicalOverride,
    publishedTime,
    modifiedTime,
    twitterSite,
    twitterCreator,
  } = input;

  const desc = (input.description ?? '').trim() || undefined;
  const canonical = canonicalOverride || `${base}${path}`;
  const absoluteImages = images.map((url) =>
    url.startsWith('http') ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`,
  );

  return {
    title,
    description: desc,
    canonical,
    openGraph: {
      title,
      description: desc,
      url: canonical,
      siteName,
      locale: ogLocale(language),
      type,
      images: absoluteImages.map((url) => ({ url })),
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      ...(type === 'article' && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: input.twitterCard ?? (absoluteImages.length ? 'summary_large_image' : 'summary'),
      title,
      description: desc,
      images: absoluteImages,
      ...(twitterSite ? { site: twitterHandle(twitterSite) } : {}),
      ...(twitterCreator ? { creator: twitterHandle(twitterCreator) } : {}),
    },
  };
}

/**
 * Renders meta tags as HTML strings. Useful for Astro or any SSR framework
 * that needs raw HTML.
 */
export function renderMetaHtml(meta: BuiltMeta): string {
  const tags: string[] = [];
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  tags.push(`<title>${esc(meta.title)}</title>`);
  if (meta.description) tags.push(`<meta name="description" content="${esc(meta.description)}">`);
  tags.push(`<link rel="canonical" href="${esc(meta.canonical)}">`);

  const og = meta.openGraph;
  tags.push(`<meta property="og:title" content="${esc(og.title)}">`);
  if (og.description) tags.push(`<meta property="og:description" content="${esc(og.description)}">`);
  tags.push(`<meta property="og:url" content="${esc(og.url)}">`);
  tags.push(`<meta property="og:type" content="${og.type}">`);
  if (og.siteName) tags.push(`<meta property="og:site_name" content="${esc(og.siteName)}">`);
  tags.push(`<meta property="og:locale" content="${esc(og.locale)}">`);
  for (const img of og.images) {
    tags.push(`<meta property="og:image" content="${esc(img.url)}">`);
  }
  if (og.publishedTime) tags.push(`<meta property="article:published_time" content="${esc(og.publishedTime)}">`);
  if (og.modifiedTime) tags.push(`<meta property="article:modified_time" content="${esc(og.modifiedTime)}">`);

  const tw = meta.twitter;
  tags.push(`<meta name="twitter:card" content="${tw.card}">`);
  tags.push(`<meta name="twitter:title" content="${esc(tw.title)}">`);
  if (tw.description) tags.push(`<meta name="twitter:description" content="${esc(tw.description)}">`);
  for (const img of tw.images) {
    tags.push(`<meta name="twitter:image" content="${esc(img)}">`);
  }
  if (tw.site) tags.push(`<meta name="twitter:site" content="${esc(tw.site)}">`);
  if (tw.creator) tags.push(`<meta name="twitter:creator" content="${esc(tw.creator)}">`);

  return tags.join('\n');
}
