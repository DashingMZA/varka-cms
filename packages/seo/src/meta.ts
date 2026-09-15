export type SeoInput = {
  siteName: string;
  siteUrl: string;
  title: string;
  description?: string;
  path: string;
  locale?: string;
  imageUrl?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedAt?: string;
  modifiedAt?: string;
};

export type SeoTags = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: Record<string, unknown>;
};

function abs(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function buildSeo(input: SeoInput): SeoTags {
  const description = (input.description ?? '').slice(0, 320);
  const title =
    input.title === input.siteName ? input.title : `${input.title} · ${input.siteName}`;
  const canonical = abs(input.siteUrl, input.path);
  const robots = input.noindex ? 'noindex, nofollow' : 'index, follow';
  const type = input.type ?? 'website';

  const openGraph: Record<string, string> = {
    'og:type': type,
    'og:site_name': input.siteName,
    'og:title': input.title,
    'og:description': description,
    'og:url': canonical,
  };
  if (input.locale) openGraph['og:locale'] = input.locale.replace('-', '_');
  if (input.imageUrl) openGraph['og:image'] = input.imageUrl;

  const twitter: Record<string, string> = {
    'twitter:card': input.imageUrl ? 'summary_large_image' : 'summary',
    'twitter:title': input.title,
    'twitter:description': description,
  };
  if (input.imageUrl) twitter['twitter:image'] = input.imageUrl;

  const jsonLd: Record<string, unknown> =
    type === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: input.title,
          description,
          mainEntityOfPage: canonical,
          datePublished: input.publishedAt,
          dateModified: input.modifiedAt ?? input.publishedAt,
          isPartOf: { '@type': 'WebSite', name: input.siteName, url: input.siteUrl },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: input.siteName,
          url: input.siteUrl,
          description,
        };

  return { title, description, canonical, robots, openGraph, twitter, jsonLd };
}
