'use client';

import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'language' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('language', key);
  if (!v || v === key || v.startsWith('language.')) return fallback;
  return v;
}
import { LanguagesAdmin } from '@/components/languages-admin';

export default function LanguagesPage() {
  const { t } = useMessages();
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>{L(t, 'languages', 'Languages')}</h1>
      <p style={{ color: 'var(--muted)', maxWidth: 560 }}>
        {L(t, 'languagesDesc', 'Manage locales for content and public URLs. Seed provides English; add Punjabi or others here.')}
      </p>
      <LanguagesAdmin />
    </main>
  );
}
