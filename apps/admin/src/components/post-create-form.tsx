'use client';

/** Deprecated: use /content/posts/new + PostEditor. Kept as thin redirect helper. */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPostAction } from '@/actions/posts';

export function PostCreateForm() {
  const router = useRouter();
  useEffect(() => {
    void (async () => {
      const result = await createPostAction('Untitled');
      if (result.ok) router.replace(`/content/posts/${result.data.id}`);
    })();
  }, [router]);
  return <p className="v-muted">Creating draft…</p>;
}
