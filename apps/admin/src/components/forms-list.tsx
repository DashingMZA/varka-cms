'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { listFormsAction, createFormAction, deleteFormAction } from '@/actions/forms';

type FormRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  entries: number;
  updatedAt: string;
};

export function FormsAdmin() {
  const { t } = useMessages();
  const [items, setItems] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listFormsAction();
      if (!result.ok) {
        setError(t('errors', 'loadFailed', 'Load failed') + `: ${result.error}`);
      } else {
        setItems(result.data);
      }
    } catch {
      setError(t('errors', 'networkError', 'Network error'));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setLoading(true);
    setError(null);
    try {
      const result = await createFormAction(name, slug);
      if (!result.ok) {
        setError(t('errors', 'saveFailed', 'Save failed') + `: ${result.error}`);
        setLoading(false);
        return;
      }
      window.location.href = `/forms/${result.data.id}`;
    } catch {
      setError(t('errors', 'networkError', 'Network error'));
      setLoading(false);
    }
  }

  async function remove(id: string, formName: string) {
    if (!window.confirm(`${t('forms', 'deleteConfirm', 'Delete this form and all its entries?')}\n${formName}`)) return;
    setLoading(true);
    try {
      const result = await deleteFormAction(id);
      if (!result.ok) setError(t('errors', 'saveFailed', 'Save failed') + `: ${result.error}`);
      else await load();
    } catch {
      setError(t('errors', 'networkError', 'Network error'));
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{t('forms', 'title', 'Forms')}</h1>
      </div>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      <section className="v-card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>{t('forms', 'addNew', 'Add New Form')}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
              {t('forms', 'name', 'Name')}
            </span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact" />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
              {t('forms', 'slug', 'Slug')} <span className="v-muted">({t('common', 'optional', 'optional')})</span>
            </span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="contact" />
          </label>
          <button type="button" className="v-btn v-btn--primary" disabled={loading} onClick={() => void create()}>
            {t('forms', 'create', 'Create Form')}
          </button>
        </div>
      </section>

      <section className="v-card">
        <h2 style={{ marginTop: 0 }}>
          {t('forms', 'allForms', 'All Forms')} ({items.length})
        </h2>
        {loading && items.length === 0 ? (
          <p className="v-muted">{t('common', 'loading', 'Loading…')}</p>
        ) : items.length === 0 ? (
          <p className="v-muted">{t('forms', 'noForms', 'No forms yet. Create your first form above.')}</p>
        ) : (
          <table className="v-list-table">
            <thead>
              <tr>
                <th>{t('forms', 'name', 'Name')}</th>
                <th>{t('forms', 'shortcode', 'Shortcode')}</th>
                <th>{t('forms', 'entries', 'Entries')}</th>
                <th>{t('common', 'status', 'Status')}</th>
                <th>{t('common', 'date', 'Date')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id}>
                  <td>
                    <strong>
                      <Link href={`/forms/${f.id}`} className="row-title">
                        {f.name}
                      </Link>
                    </strong>
                    <div className="row-actions">
                      <span>
                        <Link href={`/forms/${f.id}`}>{t('common', 'edit', 'Edit')}</Link>
                      </span>
                      {' | '}
                      <span>
                        <Link href={`/forms/${f.id}?tab=entries`}>{t('forms', 'entries', 'Entries')}</Link>
                      </span>
                      {' | '}
                      <span>
                        <a
                          href="#"
                          className="trash"
                          onClick={(e) => {
                            e.preventDefault();
                            void remove(f.id, f.name);
                          }}
                        >
                          {t('common', 'delete', 'Delete')}
                        </a>
                      </span>
                    </div>
                  </td>
                  <td>
                    <code>[varka-form slug=&quot;{f.slug}&quot;]</code>
                  </td>
                  <td>{f.entries}</td>
                  <td>{f.active ? t('forms', 'active', 'Active') : t('forms', 'inactive', 'Inactive')}</td>
                  <td>{new Date(f.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
