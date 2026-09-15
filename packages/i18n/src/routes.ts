import { DEFAULT_LOCALE, DEFAULT_POST_SEGMENT, type LanguageRecord } from './types';

/**
 * Build public post path.
 * - Default language (en): /post/{slug}
 * - Other languages: /{urlPrefix}/post/{slug}
 */
export function postPath(lang: Pick<LanguageRecord, 'defaultLanguage' | 'locale' | 'urlPrefix'>, slug: string): string {
  const s = slug.replace(/^\/+/, '');
  if (lang.defaultLanguage || lang.locale === DEFAULT_LOCALE || !lang.urlPrefix) {
    return `/${DEFAULT_POST_SEGMENT}/${s}`;
  }
  const prefix = lang.urlPrefix.replace(/^\/+|\/+$/g, '');
  return `/${prefix}/${DEFAULT_POST_SEGMENT}/${s}`;
}

export function pagePath(lang: Pick<LanguageRecord, 'defaultLanguage' | 'locale' | 'urlPrefix'>, slug: string): string {
  const s = slug.replace(/^\/+/, '');
  if (lang.defaultLanguage || lang.locale === DEFAULT_LOCALE || !lang.urlPrefix) {
    return `/${s}`;
  }
  const prefix = lang.urlPrefix.replace(/^\/+|\/+$/g, '');
  return `/${prefix}/${s}`;
}

export function homePath(lang: Pick<LanguageRecord, 'defaultLanguage' | 'locale' | 'urlPrefix'>): string {
  if (lang.defaultLanguage || lang.locale === DEFAULT_LOCALE || !lang.urlPrefix) {
    return '/';
  }
  return `/${lang.urlPrefix.replace(/^\/+|\/+$/g, '')}`;
}

export function parsePathname(
  pathname: string,
  languages: LanguageRecord[],
): { locale: string; prefix: string; rest: string } {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const parts = clean.split('/').filter(Boolean);
  const enabled = languages.filter((l) => l.enabled);

  if (parts.length === 0) {
    const def = enabled.find((l) => l.defaultLanguage) ?? enabled[0];
    return { locale: def?.locale ?? DEFAULT_LOCALE, prefix: '', rest: '/' };
  }

  const maybePrefix = parts[0]!;
  const match = enabled.find(
    (l) => !l.defaultLanguage && l.urlPrefix && l.urlPrefix.replace(/^\/+|\/+$/g, '') === maybePrefix,
  );

  if (match) {
    const restParts = parts.slice(1);
    const rest = restParts.length ? '/' + restParts.join('/') : '/';
    return { locale: match.locale, prefix: maybePrefix, rest };
  }

  const def = enabled.find((l) => l.defaultLanguage) ?? enabled[0];
  return {
    locale: def?.locale ?? DEFAULT_LOCALE,
    prefix: '',
    rest: clean,
  };
}
