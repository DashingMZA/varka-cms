'use client';

/** Deprecated: use /content/posts/new + PostEditor. Kept as thin redirect helper. */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPostAction } from '@/actions/posts';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'posts' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('posts', key);
  if (!v || v === key || v.startsWith('posts.')) return fallback;
  return v;
}

export function PostCreateForm() {
  const { t } = useMessages();
  const router = useRouter();
  useEffect(() => {
    void (async () => {
      const result = await createPostAction('Untitled');
      if (result.ok) router.replace(`/content/posts/${result.data.id}`);
    })();
  }, [router]);
  return <p className="v-muted">{L(t, 'creatingDraft', 'Creating draft…')}</p>;
}
