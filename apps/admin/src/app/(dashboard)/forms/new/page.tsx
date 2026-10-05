'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMessages } from '@/lib/i18n';
import { createFormAction } from '@/actions/forms';

/** WordPress-style Add New Form: create draft via server action, then redirect. */
export default function NewFormPage() {
  const router = useRouter();
  const { t } = useMessages();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await createFormAction('Untitled Form', 'untitled-form-' + Date.now());
        if (!result.ok) {
          if (!cancelled) setError(result.error);
          return;
        }
        const id = (result.data as { id: string }).id;
        if (!cancelled) router.replace(`/forms/${id}`);
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
      <p className="v-muted">{t('forms', 'creating', 'Creating form…')}</p>
    </main>
  );
}
