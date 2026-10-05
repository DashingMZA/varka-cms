'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';
import { Subsubsub } from '@/components/list-table/list-table';
import { useMessages } from '@/lib/i18n';
import {
  listPostsAction,
  createPostAction,
  trashPostAction,
  restorePostAction,
  deletePostPermanentlyAction,
  bulkPostsAction,
  bulkEditPostsAction,
  getPostAction,
  updatePostAction,
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
  const [bulkEditStatus, setBulkEditStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cols, setCols] = useState({ author: true, categories: true, tags: true, date: true });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  // Quick Edit (WP-style inline row editing: title, slug, status)
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [qe, setQe] = useState<{
    title: string;
    slug: string;
    status: string;
    version: number;
    languageId: string;
  } | null>(null);
  const [qeLoading, setQeLoading] = useState(false);
  const [qeError, setQeError] = useState<string | null>(null);

  async function openQuickEdit(post: PostRow) {
    setQuickEditId(post.id);
    setQe(null);
    setQeError(null);
    setQeLoading(true);
    try {
      const result = await getPostAction(post.id);
      if (!result.ok) {
        setQeError(t('errors', 'loadFailed') + `: ${result.error}`);
        setQeLoading(false);
        return;
      }
      const full = result.data as {
        version: number;
        status: string;
        translations: Array<{ languageId: string; title: string; slug: string }>;
      };
      const tr = full.translations[0];
      if (!tr) {
        setQeError(t('errors', 'loadFailed'));
        setQeLoading(false);
        return;
      }
      setQe({
        title: tr.title || '',
        slug: tr.slug || '',
        status: full.status,
        version: full.version,
        languageId: tr.languageId,
      });
    } catch {
      setQeError(t('errors', 'networkError'));
    }
    setQeLoading(false);
  }

  function closeQuickEdit() {
    setQuickEditId(null);
    setQe(null);
    setQeError(null);
  }

  async function saveQuickEdit() {
    if (!quickEditId || !qe) return;
    setQeLoading(true);
    setQeError(null);
    try {
      const result = await updatePostAction(quickEditId, {
        title: qe.title.trim() || '(no title)',
        slug: qe.slug.trim(),
        status: qe.status,
        version: qe.version,
        languageId: qe.languageId,
      });
      if (!result.ok) {
        setQeError(t('errors', 'saveFailed') + `: ${result.error}`);
        setQeLoading(false);
        return;
      }
      closeQuickEdit();
      await load();
    } catch {
      setQeError(t('errors', 'networkError'));
    }
    setQeLoading(false);
  }

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
    // Bulk edit shows inline form instead of immediate action
    if (bulk === 'edit') return;
    setLoading(true);
    try {
      const ids = Array.from(selected);
      if (bulk === 'trash') {
        await bulkPostsAction(ids, 'trash');
      } else if (bulk === 'publish') {
        await bulkPostsAction(ids, 'publish');
      } else if (bulk === 'draft') {
        await bulkPostsAction(ids, 'draft');
      } else if (bulk === 'restore') {
        await bulkPostsAction(ids, 'restore');
      } else if (bulk === 'deletePermanently') {
        if (!window.confirm(t('blogs', 'deletePermanentlyConfirm') || 'Permanently delete selected items? This cannot be undone.')) {
          setLoading(false);
          return;
        }
        await bulkPostsAction(ids, 'deletePermanently');
      }
      await load();
      setSelected(new Set());
      setBulk('');
    } catch {
      setError(t('errors', 'saveFailed'));
    }
    setLoading(false);
  }

  async function applyBulkEdit() {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      const ids = Array.from(selected);
      const updates: { status?: 'DRAFT' | 'PUBLISHED' | 'PENDING_REVIEW' } = {};
      if (bulkEditStatus) {
        updates.status = bulkEditStatus as 'DRAFT' | 'PUBLISHED' | 'PENDING_REVIEW';
      }
      const res = await bulkEditPostsAction(ids, updates);
      if (!res.ok) {
        setError(res.error);
      } else {
        await load();
        setSelected(new Set());
        setBulk('');
        setBulkEditStatus('');
      }
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
            {status === 'trash' ? (
              <>
                <option value="restore">{t('blogs', 'restore') || 'Restore'}</option>
                <option value="deletePermanently">{t('blogs', 'deletePermanently') || 'Delete Permanently'}</option>
              </>
            ) : (
              <>
                <option value="edit">{t('blogs', 'bulkEdit') || 'Edit'}</option>
                <option value="publish">{t('blogs', 'publish')}</option>
                <option value="draft">{t('blogs', 'draft')}</option>
                <option value="trash">{t('blogs', 'trash')}</option>
              </>
            )}
          </select>
          <button type="button" className="v-btn" disabled={!bulk || selected.size === 0} onClick={() => void applyBulk()}>
            {t('common', 'apply') || 'Apply'}
          </button>
        </div>
        {bulk === 'edit' && selected.size > 0 ? (
          <div className="v-panel" style={{ marginTop: 12, padding: 12 }}>
            <h4 style={{ margin: '0 0 8px' }}>
              {t('blogs', 'bulkEditTitle') || 'Bulk Edit'} ({selected.size})
            </h4>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {t('blogs', 'status') || 'Status'}:{' '}
              <select
                value={bulkEditStatus}
                onChange={(e) => setBulkEditStatus(e.target.value)}
              >
                <option value="">— {t('common', 'noChange') || 'No Change'} —</option>
                <option value="DRAFT">{t('blogs', 'draft')}</option>
                <option value="PENDING_REVIEW">{t('blogs', 'pendingReview')}</option>
                <option value="PUBLISHED">{t('blogs', 'published')}</option>
              </select>
            </label>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="v-btn v-btn--primary"
                onClick={() => void applyBulkEdit()}
                disabled={loading}
              >
                {t('common', 'update') || 'Update'}
              </button>
              <button
                type="button"
                className="v-btn"
                onClick={() => {
                  setBulk('');
                  setBulkEditStatus('');
                }}
              >
                {t('common', 'cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        ) : null}
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
              const colSpan =
                3 +
                (cols.author ? 1 : 0) +
                (cols.categories ? 1 : 0) +
                (cols.tags ? 1 : 0) +
                (cols.date ? 1 : 0);
              return (
                <Fragment key={p.id}>
                  <tr>
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
                      {status === 'trash' ? (
                        <>
                          <span>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                void (async () => {
                                  await restorePostAction(p.id);
                                  await load();
                                })();
                              }}
                            >
                              {t('blogs', 'restore') || 'Restore'}
                            </a>
                          </span>
                          {' | '}
                          <span>
                            <a
                              href="#"
                              className="trash"
                              onClick={(e) => {
                                e.preventDefault();
                                if (window.confirm(t('blogs', 'deletePermanentlyConfirm') || 'Permanently delete this item? This cannot be undone.')) {
                                  void (async () => {
                                    await deletePostPermanentlyAction(p.id);
                                    await load();
                                  })();
                                }
                              }}
                            >
                              {t('blogs', 'deletePermanently') || 'Delete Permanently'}
                            </a>
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            <Link href={`/content/posts/${p.id}`}>{t('common', 'edit') || 'Edit'}</Link>
                          </span>
                          {' | '}
                          <span>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (quickEditId === p.id) closeQuickEdit();
                                else void openQuickEdit(p);
                              }}
                            >
                              {t('blogs', 'quickEdit') || 'Quick Edit'}
                            </a>
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
                        </>
                      )}
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
                {quickEditId === p.id ? (
                  <tr className="v-quick-edit-row">
                    <td colSpan={colSpan} style={{ background: '#f6f7f7' }}>
                      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                        <legend style={{ fontWeight: 600, marginBottom: 8 }}>
                          {t('blogs', 'quickEdit') || 'Quick Edit'}
                        </legend>
                        {qeLoading && !qe ? (
                          <p className="v-muted">{t('common', 'loading') || 'Loading\u2026'}</p>
                        ) : qe ? (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: 12,
                              alignItems: 'end',
                            }}
                          >
                            <label style={{ display: 'block' }}>
                              <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                                {t('blogs', 'titleCol') || 'Title'}
                              </span>
                              <input
                                value={qe.title}
                                onChange={(e) => setQe({ ...qe, title: e.target.value })}
                                style={{ width: '100%' }}
                              />
                            </label>
                            <label style={{ display: 'block' }}>
                              <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                                {t('blogs', 'slug') || 'Slug'}
                              </span>
                              <input
                                value={qe.slug}
                                onChange={(e) => setQe({ ...qe, slug: e.target.value })}
                                style={{ width: '100%' }}
                              />
                            </label>
                            <label style={{ display: 'block' }}>
                              <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                                {t('blogs', 'status') || 'Status'}
                              </span>
                              <select
                                value={qe.status}
                                onChange={(e) => setQe({ ...qe, status: e.target.value })}
                                style={{ width: '100%' }}
                              >
                                <option value="PUBLISHED">{t('blogs', 'published') || 'Published'}</option>
                                <option value="DRAFT">{t('blogs', 'draft') || 'Draft'}</option>
                                <option value="PENDING_REVIEW">{t('blogs', 'pending') || 'Pending'}</option>
                                <option value="TRASHED">{t('blogs', 'trash') || 'Trash'}</option>
                              </select>
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                className="v-btn v-btn--primary v-btn--small"
                                disabled={qeLoading}
                                onClick={() => void saveQuickEdit()}
                              >
                                {t('common', 'update') || 'Update'}
                              </button>
                              <button
                                type="button"
                                className="v-btn v-btn--small"
                                disabled={qeLoading}
                                onClick={closeQuickEdit}
                              >
                                {t('common', 'cancel') || 'Cancel'}
                              </button>
                            </div>
                          </div>
                        ) : null}
                        {qeError ? (
                          <p role="alert" className="v-alert v-alert--error" style={{ marginTop: 8 }}>
                            {qeError}
                          </p>
                        ) : null}
                      </fieldset>
                    </td>
                  </tr>
                ) : null}
                </Fragment>
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
