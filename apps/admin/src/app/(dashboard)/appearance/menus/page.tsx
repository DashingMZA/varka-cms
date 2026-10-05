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
import { MenuBuilder } from '@/components/menu-builder';

export default function AppearanceMenusPage() {
  const { t } = useMessages();
  return (
    <main>
      <h1 className="v-page-title">{L(t, 'menus', 'Menus')}</h1>
      <p className="v-muted" style={{ marginBottom: 16 }}>
        {L(t, 'menusDesc', 'Build navigation menus and assign them to theme locations. Changes persist to site settings.')}
      </p>
      <MenuBuilder />
    </main>
  );
}
