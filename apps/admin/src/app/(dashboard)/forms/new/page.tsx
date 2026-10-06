'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMessages } from '@/lib/i18n';
import { createFormAction } from '@/actions/forms';

/** WordPress-style Add New Form: only creates when the user submits. */
export default function NewFormPage() {
  const router = useRouter();
  const { t } = useMessages();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('forms', 'nameRequired', 'Form name is required.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await createFormAction(name.trim(), slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const id = (result.data as { id: string }).id;
      router.replace(`/forms/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1 className="v-page-title">{t('forms', 'addNew', 'Add New Form')}</h1>
      <div className="v-card" style={{ maxWidth: 560 }}>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <label>
            <span className="v-label">{t('forms', 'name', 'Name')}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('forms', 'namePlaceholder', 'Contact Form')}
              style={{ width: '100%' }}
              autoFocus
            />
          </label>
          <label>
            <span className="v-label">{t('forms', 'slug', 'Slug')} ({t('common', 'optional', 'Optional')})</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={t('forms', 'slugPlaceholder', 'contact-form')}
              style={{ width: '100%' }}
              dir="ltr"
            />
          </label>
          {error ? (
            <p role="alert" className="v-alert v-alert--error">{error}</p>
          ) : null}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="v-btn v-btn--primary" disabled={busy}>
              {busy ? t('common', 'creating', 'Creating…') : t('forms', 'createForm', 'Create Form')}
            </button>
            <Link href="/forms" className="v-btn">{t('common', 'cancel', 'Cancel')}</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
