'use client';

import {
  loadAllMessages,
  resolveLocale,
  isRtlLocale,
  SUPPORTED_LOCALES,
  type AppLocale,
  type MessageNamespace,
  type MessageTree,
  t as tPath,
} from '@varka/i18n';

const COOKIE = 'varka_locale';

/** Client-only. On server always returns 'en' — pass explicit locale from layout instead. */
export function getStoredLocale(): AppLocale {
  if (typeof document === 'undefined') return 'en';
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  const fromCookie = m?.[1] ? decodeURIComponent(m[1]) : null;
  if (fromCookie) return resolveLocale(fromCookie);
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return resolveLocale(nav);
}

export function setStoredLocale(locale: AppLocale) {
  document.cookie = `${COOKIE}=${encodeURIComponent(locale)};path=/;max-age=31536000;SameSite=Lax`;
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
  document.documentElement.dataset.locale = locale;
}

/**
 * Prefer an explicit locale (from server layout cookie) so SSR + first client paint match.
 */
export function useMessages(locale?: string) {
  const loc = resolveLocale(locale ?? getStoredLocale());
  const messages = loadAllMessages(loc);
  function t(ns: MessageNamespace, key: string, fallback?: string) {
    return tPath(messages[ns] as MessageTree, key, fallback);
  }
  return { locale: loc, messages, t, isRtl: isRtlLocale(loc), locales: SUPPORTED_LOCALES };
}

export { SUPPORTED_LOCALES, resolveLocale, isRtlLocale, tPath as t };
