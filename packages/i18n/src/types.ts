export type LanguageRecord = {
  id: string;
  locale: string;
  languageCode: string;
  script: string;
  direction: 'ltr' | 'rtl' | string;
  urlPrefix: string;
  defaultLanguage: boolean;
  enabled: boolean;
};

/** Locked V1 defaults for VARKA */
export const DEFAULT_LOCALE = 'en';
/** Default-language post path segment (no locale prefix) */
export const DEFAULT_POST_SEGMENT = 'post';
