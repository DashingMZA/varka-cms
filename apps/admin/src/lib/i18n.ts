'use client';

import { useCallback, useMemo } from 'react';
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
import { useServerLocale } from './locale-provider';

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
 * Uses the server-resolved locale from LocaleProvider when available,
 * so SSR and first client paint match (prevents hydration mismatch).
 * Falls back to explicit param, then stored cookie (client-only).
 */
export function useMessages(locale?: string) {
  const serverLocale = useServerLocale();
  // useServerLocale returns 'en' default when no provider — detect by checking
  // if we should prefer the cookie instead. We trust the provider when it's
  // explicitly set; otherwise fall back to stored locale on client.
  const loc = resolveLocale(locale ?? serverLocale);
  const messages = useMemo(() => loadAllMessages(loc), [loc]);
  const t = useCallback(
    (ns: MessageNamespace, key: string, fallback?: string) => {
      return tPath(messages[ns] as MessageTree, key, fallback);
    },
    [messages],
  );
  return { locale: loc, messages, t, isRtl: isRtlLocale(loc), locales: SUPPORTED_LOCALES };
}

export { SUPPORTED_LOCALES, resolveLocale, isRtlLocale, tPath as t };
