'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMessages } from '@/lib/i18n';
import { createPostAction } from '@/actions/posts';

/** WordPress-style Add New: create draft via server action, then redirect. */
export default function NewPostPage() {
  const router = useRouter();
  const { t } = useMessages();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await createPostAction('Untitled');
        if (!result.ok) {
          if (!cancelled) setError(result.error);
          return;
        }
        if (!cancelled) router.replace(`/content/posts/${result.data.id}`);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Create failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <main>
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main>
      <p className="v-muted">{t('blogs', 'creating', 'Creating draft…')}</p>
    </main>
  );
}
