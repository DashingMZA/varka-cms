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
import Link from 'next/link';

export default function AppearancePage() {
  const { t } = useMessages();
  return (
    <main>
      <h1 className="v-page-title">{L(t, 'appearance', 'Appearance')}</h1>
      <p className="v-muted">{L(t, 'appearanceDesc', 'Manage themes, menus, and widget areas for the public site.')}</p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 16, display: 'grid', gap: 8, maxWidth: 360 }}>
        <li>
          <Link className="v-btn" href="/appearance/themes">
            {L(t, 'themes', 'Themes')}
          </Link>
        </li>
        <li>
          <Link className="v-btn" href="/appearance/menus">
            {L(t, 'menus', 'Menus')}
          </Link>
        </li>
        <li>
          <Link className="v-btn" href="/appearance/widgets">
            {L(t, 'widgets', 'Widgets')}
          </Link>
        </li>
      </ul>
    </main>
  );
}
