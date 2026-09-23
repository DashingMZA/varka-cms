'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';
import { Subsubsub } from '@/components/list-table/list-table';
import { useMessages } from '@/lib/i18n';

type PageRow = {
  id: string;
  status: string;
  updatedAt: string;
  translations: Array<{ title: string; slug: string }>;
  author?: { name?: string | null; email?: string | null } | null;
};

type Counts = { all: number; published: number; draft: number; trashed: number };

export function PagesAdmin() {
  const { t } = useMessages();
  const [items, setItems] = useState<PageRow[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, published: 0, draft: 0, trashed: 0 });
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (status !== 'all') params.set('status', status.toUpperCase());
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/pages?${params}`, { credentials: 'include' });
      if (!res.ok) {
        setError(t('errors', 'loadFailed') + ` (${res.status})`);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { items: PageRow[]; counts?: Counts };
      const list = data.items ?? [];
      setItems(list);
      if (data.counts) setCounts(data.counts);
      else {
        setCounts({
          all: list.length,
          published: list.filter((p) => p.status === 'PUBLISHED').length,
          draft: list.filter((p) => p.status === 'DRAFT').length,
          trashed: list.filter((p) => p.status === 'TRASHED').length,
        });
      }
      setSelected(new Set());
    } catch {
      setError(t('errors', 'networkError'));
    }
    setLoading(false);
  }, [status, q, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPage() {
    window.location.href = '/content/pages/new';
  }

  async function applyBulk() {
    if (!bulk || selected.size === 0) return;
    setLoading(true);
    try {
      for (const id of selected) {
        if (bulk === 'trash') {
          await fetch(`/api/pages/${id}`, { method: 'DELETE', credentials: 'include' });
        } else {
          await fetch(`/api/pages/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              status: bulk === 'publish' ? 'PUBLISHED' : 'DRAFT',
            }),
          });
        }
      }
      await load();
    } catch {
      setError(t('errors', 'saveFailed'));
    }
    setLoading(false);
  }

  return (
    <div>
      <ScreenMeta
        help={[
          {
            id: 'pages',
            title: t('pages', 'title'),
            body: t('pages', 'helpBody') || 'Pages are hierarchical content.',
          },
        ]}
        options={[]}
      />

      <div className="v-page-header">
        <h1 className="v-page-title">{t('pages', 'title')}</h1>
        <button type="button" className="v-btn v-btn--primary" onClick={() => void createPage()}>
          {t('pages', 'addNew')}
        </button>
      </div>

      <Subsubsub
        active={status}
        onChange={setStatus}
        items={[
          { id: 'all', label: t('pages', 'all') || 'All', count: counts.all },
          {
            id: 'published',
            label: t('pages', 'published') || 'Published',
            count: counts.published,
          },
          { id: 'draft', label: t('pages', 'draft') || 'Draft', count: counts.draft },
          { id: 'trashed', label: t('pages', 'trash') || 'Trash', count: counts.trashed },
        ]}
      />

      <div className="v-tablenav">
        <select
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          aria-label={t('common', 'bulkActions')}
        >
          <option value="">{t('common', 'bulkActions')}</option>
          <option value="publish">{t('common', 'publish') || 'Publish'}</option>
          <option value="draft">{t('common', 'moveToDraft')}</option>
          <option value="trash">{t('common', 'moveToTrash')}</option>
        </select>
        <button
          type="button"
          className="v-btn"
          disabled={!bulk || selected.size === 0}
          onClick={() => void applyBulk()}
        >
          {t('common', 'apply')}
        </button>
        <input
          type="search"
          placeholder={t('pages', 'searchPages')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void load();
          }}
          aria-label={t('common', 'search')}
        />
        <button type="button" className="v-btn" onClick={() => void load()}>
          {t('common', 'search')}
        </button>
        {loading ? <span className="v-muted">{t('common', 'loading')}</span> : null}
      </div>

      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <div className="v-table-wrap">
        <table className="v-table">
          <thead>
            <tr>
              <th className="check-col">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelected(new Set(items.map((p) => p.id)));
                    else setSelected(new Set());
                  }}
                  aria-label={t('tables', 'selectAll')}
                />
              </th>
              <th>{t('pages', 'titleCol') || 'Title'}</th>
              <th>{t('pages', 'author') || 'Author'}</th>
              <th>{t('pages', 'status') || 'Status'}</th>
              <th>{t('pages', 'date') || 'Date'}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="v-muted" style={{ padding: 16 }}>
                  {t('pages', 'noPages')}
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const tr = p.translations[0];
                return (
                  <tr key={p.id}>
                    <td className="check-col">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={(e) => {
                          setSelected((prev) => {
                            const n = new Set(prev);
                            if (e.target.checked) n.add(p.id);
                            else n.delete(p.id);
                            return n;
                          });
                        }}
                      />
                    </td>
                    <td>
                      <Link href={`/content/pages/${p.id}`} className="row-title">
                        {tr?.title || t('pages', 'untitled') || 'Untitled'}
                      </Link>
                      <div className="row-actions">
                        <Link href={`/content/pages/${p.id}`}>{t('common', 'edit') || 'Edit'}</Link>
                        <a
                          href="#"
                          className="trash"
                          onClick={(e) => {
                            e.preventDefault();
                            void (async () => {
                              await fetch(`/api/pages/${p.id}`, {
                                method: 'DELETE',
                                credentials: 'include',
                              });
                              await load();
                            })();
                          }}
                        >
                          {t('common', 'trash') || 'Trash'}
                        </a>
                        <span className="v-muted" style={{ fontSize: 12 }}>
                          /{tr?.slug}
                        </span>
                      </div>
                    </td>
                    <td>{p.author?.name || p.author?.email || '—'}</td>
                    <td>
                      <span className={`v-status v-status--${p.status.toLowerCase()}`}>
                        {p.status.replaceAll('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(p.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
