'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMessages } from '@/lib/i18n';

/**
 * WordPress-style "Add New": create a draft via API, then redirect to the editor.
 */
export default function NewPostPage() {
  const router = useRouter();
  const { t } = useMessages();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title: 'Untitled' }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(body.error ?? `Create failed (${res.status})`);
          return;
        }
        const post = (await res.json()) as { id: string };
        if (!cancelled) router.replace(`/content/posts/${post.id}`);
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
