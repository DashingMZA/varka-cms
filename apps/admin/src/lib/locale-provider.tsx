'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AppLocale } from '@varka/i18n';

const LocaleContext = createContext<AppLocale>('en');

/** Provides the server-resolved locale so SSR and client render match (no hydration mismatch). */
export function LocaleProvider({ locale, children }: { locale: AppLocale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** Locale resolved on the server from the varka_locale cookie. Falls back to 'en' outside provider. */
export function useServerLocale(): AppLocale {
  return useContext(LocaleContext);
}
