'use client';

import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'appearance' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('appearance', key);
  if (!v || v === key || v.startsWith('appearance.')) return fallback;
  return v;
}
import { ThemePicker } from '@/components/theme-picker';

export default function AppearanceThemesPage() {
  const { t } = useMessages();
  return (
    <main>
      <h1 className="v-page-title">{L(t, 'themes', 'Themes')}</h1>
      <p className="v-muted">
        {L(t, 'themesDescPrefix', 'Activate a public-site theme. Themes follow the shared contract in ')}
        <code>@varka/themes</code>
        {L(t, 'themesDescSuffix', '.')}
      </p>
      <ThemePicker />
    </main>
  );
}
