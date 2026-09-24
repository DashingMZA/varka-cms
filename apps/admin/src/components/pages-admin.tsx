'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';
import { Subsubsub } from '@/components/list-table/list-table';
import { useMessages } from '@/lib/i18n';
import {
  listPagesAction,
  createPageAction,
  trashPageAction,
} from '@/actions/pages';

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPagesAction({
        q: q.trim() || undefined,
        limit: 100,
      });
      if (!result.ok) {
        setError(t('errors', 'loadFailed') + `: ${result.error}`);
        setLoading(false);
        return;
      }
      let list = (result.data.items as PageRow[]) ?? [];
      const allItems = list;
      if (status !== 'all') {
        list = list.filter((p) => p.status === status.toUpperCase());
      }
      setItems(list);
      setCounts({
        all: allItems.length,
        published: allItems.filter((p) => p.status === 'PUBLISHED').length,
        draft: allItems.filter((p) => p.status === 'DRAFT').length,
        trashed: allItems.filter((p) => p.status === 'TRASHED').length,
      });
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
    setLoading(true);
    const result = await createPageAction('Untitled');
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.href = `/content/pages/${result.data.id}`;
  }

  async function trashSelected() {
    if (selected.size === 0) return;
    setLoading(true);
    for (const id of selected) {
      await trashPageAction(id);
    }
    await load();
  }

  return (
    <div>
      <ScreenMeta
        help={[
          {
            id: 'pages',
            title: t('pages', 'title') || 'Pages',
            body: t('pages', 'helpBody') || 'Create and manage static pages.',
          },
        ]}
        options={[]}
      />

      <div className="v-page-header">
        <h1 className="v-page-title">{t('pages', 'title') || 'Pages'}</h1>
        <button type="button" className="v-btn v-btn--primary" onClick={() => void createPage()}>
          {t('pages', 'addNew') || 'Add New'}
        </button>
      </div>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      <Subsubsub
        active={status}
        onChange={setStatus}
        items={[
          { id: 'all', label: `${t('pages', 'all') || 'All'} (${counts.all})` },
          { id: 'published', label: `${t('pages', 'published') || 'Published'} (${counts.published})` },
          { id: 'draft', label: `${t('pages', 'draft') || 'Draft'} (${counts.draft})` },
          { id: 'trash', label: `${t('pages', 'trash') || 'Trash'} (${counts.trashed})` },
        ]}
      />

      <div className="v-list-table-top">
        <div className="v-bulk">
          <button
            type="button"
            className="v-btn"
            disabled={selected.size === 0}
            onClick={() => void trashSelected()}
          >
            {t('common', 'trash') || 'Trash'}
          </button>
        </div>
        <div className="v-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('pages', 'searchPages') || 'Search pages…'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load();
            }}
          />
          <button type="button" className="v-btn" onClick={() => void load()}>
            {t('common', 'search') || 'Search'}
          </button>
          {loading ? <span className="v-muted">{t('common', 'loading')}</span> : null}
        </div>
      </div>

      <div className="v-list-table-wrap">
        <table className="v-list-table">
          <thead>
            <tr>
              <td className="check-col">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelected(new Set(items.map((p) => p.id)));
                    else setSelected(new Set());
                  }}
                />
              </td>
              <th>{t('pages', 'titleCol') || 'Title'}</th>
              <th>{t('pages', 'author') || 'Author'}</th>
              <th>{t('pages', 'status') || 'Status'}</th>
              <th>{t('pages', 'date') || 'Date'}</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="v-muted" style={{ padding: 16 }}>
                  {t('common', 'loading')}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="v-muted" style={{ padding: 16 }}>
                  {t('pages', 'noPages') || 'No pages found.'}
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const tr = p.translations?.[0];
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
                        {' | '}
                        <a
                          href="#"
                          className="trash"
                          onClick={(e) => {
                            e.preventDefault();
                            void (async () => {
                              await trashPageAction(p.id);
                              await load();
                            })();
                          }}
                        >
                          {t('common', 'trash') || 'Trash'}
                        </a>
                        <span className="v-muted" style={{ fontSize: 12 }}>
                          {' '}/{tr?.slug}
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
