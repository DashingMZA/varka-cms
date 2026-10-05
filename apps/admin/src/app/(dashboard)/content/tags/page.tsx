'use client';

import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'tags' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('tags', key);
  if (!v || v === key || v.startsWith('tags.')) return fallback;
  return v;
}
import { TagsAdmin } from '@/components/tags-admin';

export default function TagsPage() {
  const { t } = useMessages();
  return (
    <main>
      <h1 className="v-page-title">{L(t, 'tags', 'Tags')}</h1>
      <TagsAdmin />
    </main>
  );
}
