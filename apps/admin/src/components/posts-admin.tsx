'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';
import { Subsubsub } from '@/components/list-table/list-table';
import { useMessages } from '@/lib/i18n';
import {
  listPostsAction,
  createPostAction,
  trashPostAction,
  bulkPostsAction,
} from '@/actions/posts';

type PostRow = {
  id: string;
  status: string;
  updatedAt?: string;
  publishedAt?: string | null;
  translations?: Array<{ title?: string; slug?: string }>;
  author?: { name?: string | null; email?: string } | null;
};

type Counts = { all: number; published: number; draft: number; trashed: number };

export function PostsAdmin() {
  const { t } = useMessages();
  const [items, setItems] = useState<PostRow[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, published: 0, draft: 0, trashed: 0 });
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cols, setCols] = useState({ author: true, categories: true, tags: true, date: true });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('varka.screen.posts');
      if (raw) setCols((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCol(key: keyof typeof cols) {
    setCols((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('varka.screen.posts', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPostsAction({
        page,
        perPage,
        status: status !== 'all' ? status.toUpperCase() : undefined,
        q: q.trim() || undefined,
      });
      if (!result.ok) {
        setError(t('errors', 'loadFailed') + `: ${result.error}`);
        setLoading(false);
        return;
      }
      setItems((result.data.items as PostRow[]) ?? []);
      setCounts((result.data.counts as Counts) ?? counts);
      setTotal(result.data.total ?? 0);
      setSelected(new Set());
    } catch {
      setError(t('errors', 'networkError'));
    }
    setLoading(false);
  }, [status, q, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (status === 'all') return items;
    return items.filter((p) => p.status === status.toUpperCase());
  }, [items, status]);

  async function createPost() {
    setLoading(true);
    try {
      const result = await createPostAction('Untitled');
      if (!result.ok) {
        setError(t('errors', 'saveFailed') + `: ${result.error}`);
        setLoading(false);
        return;
      }
      window.location.href = `/content/posts/${result.data.id}`;
    } catch {
      setError(t('errors', 'networkError'));
      setLoading(false);
    }
  }

  async function applyBulk() {
    if (!bulk || selected.size === 0) return;
    setLoading(true);
    try {
      const ids = Array.from(selected);
      if (bulk === 'trash') {
        await bulkPostsAction(ids, 'trash');
      } else if (bulk === 'publish') {
        await bulkPostsAction(ids, 'publish');
      } else if (bulk === 'draft') {
        await bulkPostsAction(ids, 'draft');
      }
      await load();
      setSelected(new Set());
      setBulk('');
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
            id: 'list',
            title: t('blogs', 'title'),
            body: t('blogs', 'helpBody') || 'Filter by status, search, and bulk actions.',
          },
        ]}
        options={[
          {
            id: 'author',
            label: t('blogs', 'author'),
            checked: cols.author,
            onChange: () => toggleCol('author'),
          },
          {
            id: 'categories',
            label: t('blogs', 'categories'),
            checked: cols.categories,
            onChange: () => toggleCol('categories'),
          },
          {
            id: 'tags',
            label: t('blogs', 'tags'),
            checked: cols.tags,
            onChange: () => toggleCol('tags'),
          },
          {
            id: 'date',
            label: t('blogs', 'date'),
            checked: cols.date,
            onChange: () => toggleCol('date'),
          },
        ]}
      />

      <div className="v-page-header">
        <h1 className="v-page-title">{t('blogs', 'title')}</h1>
        <button type="button" className="v-btn v-btn--primary" onClick={() => void createPost()}>
          {t('blogs', 'addNew')}
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
          { id: 'all', label: `${t('blogs', 'all')} (${counts.all})` },
          { id: 'published', label: `${t('blogs', 'published')} (${counts.published})` },
          { id: 'draft', label: `${t('blogs', 'draft')} (${counts.draft})` },
          { id: 'pending', label: t('blogs', 'pending') },
          { id: 'trash', label: `${t('blogs', 'trash')} (${counts.trashed})` },
        ]}
      />

      <div className="v-list-table-top">
        <div className="v-bulk">
          <select value={bulk} onChange={(e) => setBulk(e.target.value)}>
            <option value="">{t('blogs', 'bulkActions')}</option>
            <option value="publish">{t('blogs', 'publish')}</option>
            <option value="draft">{t('blogs', 'draft')}</option>
            <option value="trash">{t('blogs', 'trash')}</option>
          </select>
          <button type="button" className="v-btn" disabled={!bulk || selected.size === 0} onClick={() => void applyBulk()}>
            {t('common', 'apply') || 'Apply'}
          </button>
        </div>
        <div className="v-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('blogs', 'searchPosts')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load();
            }}
          />
          <button type="button" className="v-btn" onClick={() => void load()}>
            {t('blogs', 'searchButton')}
          </button>
          {loading ? <span className="v-muted">{t('common', 'loading')}</span> : null}
        </div>
      </div>

      <table className="v-list-table">
        <thead>
          <tr>
            <td className="check-column">
              <input
                type="checkbox"
                checked={filtered.length > 0 && selected.size === filtered.length}
                onChange={(e) => {
                  if (e.target.checked) setSelected(new Set(filtered.map((p) => p.id)));
                  else setSelected(new Set());
                }}
              />
            </td>
            <th>{t('blogs', 'titleCol')}</th>
            {cols.author ? <th>{t('blogs', 'author')}</th> : null}
            {cols.categories ? <th>{t('blogs', 'categories')}</th> : null}
            {cols.tags ? <th>{t('blogs', 'tags')}</th> : null}
            <th>{t('blogs', 'status')}</th>
            {cols.date ? <th>{t('blogs', 'date')}</th> : null}
          </tr>
        </thead>
        <tbody>
          {loading && filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="v-muted">
                {t('common', 'loading')}
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={7}>{t('blogs', 'noPosts')}</td>
            </tr>
          ) : (
            filtered.map((p) => {
              const title = p.translations?.[0]?.title || '(no title)';
              return (
                <tr key={p.id}>
                  <th className="check-column">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(p.id);
                          else next.delete(p.id);
                          return next;
                        });
                      }}
                    />
                  </th>
                  <td>
                    <strong>
                      <Link href={`/content/posts/${p.id}`} className="row-title">
                        {title}
                      </Link>
                    </strong>
                    <div className="row-actions">
                      <span>
                        <Link href={`/content/posts/${p.id}`}>{t('common', 'edit') || 'Edit'}</Link>
                      </span>
                      {' | '}
                      <a
                        href="#"
                        className="trash"
                        onClick={(e) => {
                          e.preventDefault();
                          void (async () => {
                            await trashPostAction(p.id);
                            await load();
                          })();
                        }}
                      >
                        {t('common', 'trash') || 'Trash'}
                      </a>
                    </div>
                  </td>
                  {cols.author ? <td>{p.author?.name || p.author?.email || '—'}</td> : null}
                  {cols.categories ? <td>—</td> : null}
                  {cols.tags ? <td>—</td> : null}
                  <td>{p.status}</td>
                  {cols.date ? (
                    <td>{p.publishedAt || p.updatedAt || '—'}</td>
                  ) : null}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {total > perPage ? (
        <div className="v-pagination" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          <button
            className="v-btn v-btn--small"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← {t('common', 'previous')}
          </button>
          <span className="v-muted" style={{ fontSize: 13 }}>
            {t('common', 'page')} {page} {t('common', 'of')} {Math.ceil(total / perPage)} ({total} {t('common', 'items')})
          </span>
          <button
            className="v-btn v-btn--small"
            disabled={page >= Math.ceil(total / perPage) || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common', 'next')} →
          </button>
        </div>
      ) : null}
    </div>
  );
}
