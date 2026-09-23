'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';
import { Subsubsub } from '@/components/list-table/list-table';
import { useMessages } from '@/lib/i18n';

type PostRow = {
  id: string;
  status: string;
  publishedAt?: string | null;
  updatedAt?: string;
  translations?: Array<{ title?: string; slug?: string }>;
  author?: { name?: string | null; email?: string } | null;
};

export function PostsAdmin() {
  const { t } = useMessages();
  const [items, setItems] = useState<PostRow[]>([]);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cols, setCols] = useState({ author: true, categories: true, tags: true, date: true });

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
      const params = new URLSearchParams();
      if (status && status !== 'all') params.set('status', status.toUpperCase());
      const res = await fetch(`/api/posts?${params}`, { credentials: 'include' });
      if (!res.ok) {
        setError(t('errors', 'loadFailed') + ` (${res.status})`);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { items?: PostRow[] };
      setItems(data.items ?? []);
    } catch {
      setError(t('errors', 'networkError'));
    }
    setLoading(false);
  }, [status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const qq = q.toLowerCase();
    return items.filter((p) => {
      const title = p.translations?.[0]?.title ?? '';
      return title.toLowerCase().includes(qq);
    });
  }, [items, q]);

  async function createPost() {
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: 'Untitled' }),
      });
      if (!res.ok) {
        setError(t('errors', 'saveFailed') + ` (${res.status})`);
        setLoading(false);
        return;
      }
      const post = (await res.json()) as { id: string };
      window.location.href = `/content/posts/${post.id}`;
    } catch {
      setError(t('errors', 'networkError'));
      setLoading(false);
    }
  }

  async function applyBulk() {
    if (!bulk || selected.size === 0) return;
    setLoading(true);
    try {
      for (const id of selected) {
        if (bulk === 'trash') {
          await fetch(`/api/posts/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
        } else if (bulk === 'publish' || bulk === 'draft') {
          await fetch(`/api/posts/${id}`, {
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
          { id: 'all', label: t('blogs', 'all') },
          { id: 'published', label: t('blogs', 'published') },
          { id: 'draft', label: t('blogs', 'draft') },
          { id: 'pending', label: t('blogs', 'pending') },
          { id: 'trash', label: t('blogs', 'trash') },
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
          />
          <button type="button" className="v-btn" onClick={() => void load()}>
            {t('blogs', 'searchButton')}
          </button>
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
    </div>
  );
}
