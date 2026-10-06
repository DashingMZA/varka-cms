'use client';

import { SUPPORTED_LOCALES, type AppLocale } from '@varka/i18n';
import { useMessages } from '@/lib/i18n';

/**
 * Shared auth page header: VARKA brand centered, language selector top-right.
 * Language names are localized via Intl.DisplayNames (e.g. Urdu locale shows اردو).
 */
export function AuthHeader({
  locale,
  onLocale,
}: {
  locale: AppLocale;
  onLocale: (next: AppLocale) => void;
}) {
  const { t } = useMessages(locale);

  function langName(code: string): string {
    try {
      const dn = new Intl.DisplayNames([locale], { type: 'language' });
      return dn.of(code) ?? code;
    } catch {
      return code;
    }
  }

  return (
    <div className="v-login-header-row">
      <span className="v-login-header-spacer" />
      <h1 className="v-login-brand">VARKA</h1>
      <label className="v-login-lang v-login-lang--top">
        <span className="v-sr-only">{t('common', 'language')}</span>
        <select
          value={locale}
          onChange={(e) => onLocale(e.target.value as AppLocale)}
          aria-label={t('common', 'language')}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>
              {langName(l)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
