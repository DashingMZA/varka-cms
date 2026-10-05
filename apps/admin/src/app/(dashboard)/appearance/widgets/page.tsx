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
import { WidgetsAdmin } from '@/components/widgets-admin';

export default function AppearanceWidgetsPage() {
  const { t } = useMessages();
  return (
    <main>
      <h1 className="v-page-title">{L(t, 'widgets', 'Widgets')}</h1>
      <p className="v-muted" style={{ marginBottom: 16 }}>
        {L(t, 'widgetsDesc', 'Drag widgets into theme zones. Changes save to site settings.')}
      </p>
      <WidgetsAdmin />
    </main>
  );
}
