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
import { UserNewForm } from '@/components/user-new-form';

export default function AddUserPage() {
  const { t } = useMessages();
  return (
    <main>
      <h1 className="v-page-title">{L(t, 'addUser', 'Add User')}</h1>
      <UserNewForm />
    </main>
  );
}
