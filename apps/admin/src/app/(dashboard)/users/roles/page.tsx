'use client';

import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'users' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('users', key);
  if (!v || v === key || v.startsWith('users.')) return fallback;
  return v;
}
import { RolesMatrix } from '@/components/roles-matrix';

export default function RolesPage() {
  const { t } = useMessages();
  return (
    <main>
      <h1 className="v-page-title">{L(t, 'rolesCapabilities', 'Roles & Capabilities')}</h1>
      <RolesMatrix />
    </main>
  );
}
