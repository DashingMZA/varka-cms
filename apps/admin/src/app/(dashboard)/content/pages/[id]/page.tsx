'use client';

import { use } from 'react';
import { PageEditor } from '@/components/page-editor';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'pages' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('pages', key);
  if (!v || v === key || v.startsWith('pages.')) return fallback;
  return v;
}

export default function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useMessages();
  const { id } = use(params);
  return (
    <main>
      <h1 className="v-page-title">{L(t, 'editPage', 'Edit Page')}</h1>
      <PageEditor pageId={id} />
    </main>
  );
}
