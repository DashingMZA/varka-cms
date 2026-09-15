import { buildSeo, type SeoInput } from '@varka/seo';

const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
const SITE_NAME = import.meta.env.PUBLIC_SITE_NAME || 'VARKA';

export function siteSeo(partial: Omit<SeoInput, 'siteName' | 'siteUrl'> & Partial<Pick<SeoInput, 'siteName' | 'siteUrl'>>) {
  return buildSeo({
    siteName: partial.siteName ?? SITE_NAME,
    siteUrl: partial.siteUrl ?? SITE_URL,
    title: partial.title,
    description: partial.description,
    path: partial.path,
    locale: partial.locale,
    imageUrl: partial.imageUrl,
    type: partial.type,
    noindex: partial.noindex,
    publishedAt: partial.publishedAt,
    modifiedAt: partial.modifiedAt,
  });
}
