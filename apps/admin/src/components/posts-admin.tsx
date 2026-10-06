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
  categories?: Array<{ id: string; translations?: Array<{ name?: string }> }>;
  tags?: Array<{ id: string; translations?: Array<{ name?: string }> }>;
};

type Counts = { all: number; published: number; draft: number; trashed: number };

type InitialPosts = {
  items: Array<Record<string, unknown>>;
  counts: Record<string, number>;
  total: number;
} | null;

export function PostsAdmin({
  initialPosts = null,
  initialCategories = [],
}: {
  initialPosts?: InitialPosts;
  initialCategories?: Array<{ id: string; name: string }>;
}) {
  const { t } = useMessages();
  const [items, setItems] = useState<PostRow[]>(() => (initialPosts?.items as PostRow[]) ?? []);
  const [counts, setCounts] = useState<Counts>(() => ({
    all: initialPosts?.counts.all ?? 0,
    published: initialPosts?.counts.published ?? 0,
    draft: initialPosts?.counts.draft ?? 0,
    trashed: initialPosts?.counts.trashed ?? 0,
  }));
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // YYYY-MM format
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>(initialCategories);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState('');
  const [bulkEditStatus, setBulkEditStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cols, setCols] = useState({ author: true, categories: true, tags: true, date: true, comments: true, seo: true });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(() => initialPosts?.total ?? 0);
  // Track if initial server data was used, so we don't refetch on first mount
  const [hydrated, setHydrated] = useState(false);
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
        dateFilter: dateFilter || undefined,
        categoryId: categoryFilter || undefined,
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
  }, [status, q, dateFilter, categoryFilter, page, t]);

  useEffect(() => {
    // Skip first fetch when server already provided initial data (WordPress-style instant render)
    if (!hydrated && initialPosts) {
      setHydrated(true);
      return;
    }
    void load();
  }, [load, hydrated, initialPosts]);

  // Load categories for filter dropdown (skip if server provided them)
  useEffect(() => {
    if (initialCategories.length > 0) return;
    void (async () => {
      try {
        const { listCategoriesAction } = await import('@/actions/taxonomy');
        const result = await listCategoriesAction();
        if (result.ok) {
          const cats = (result.data.items as Array<{ id: string; translations?: Array<{ name?: string }> }>) ?? [];
          setCategories(cats.map((c) => ({ id: c.id, name: c.translations?.[0]?.name || c.id })));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (status === 'all') return items;
    const dbStatus = status === 'pending' ? 'PENDING_REVIEW' : status === 'trash' ? 'TRASHED' : status.toUpperCase();
    return items.filter((p) => p.status === dbStatus);
  }, [items, status]);

  function createPost() {
    // Don't create a draft on click — navigate to blank editor like WordPress.
    // The draft is created only when the user types a title/content or saves.
    window.location.href = '/content/posts/new';
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
          {
            id: 'comments',
            label: t('blogs', 'comments') || 'Comments',
            checked: cols.comments,
            onChange: () => toggleCol('comments'),
          },
          {
            id: 'seo',
            label: t('blogs', 'seoDetails') || 'SEO Details',
            checked: cols.seo,
            onChange: () => toggleCol('seo'),
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
        {/* WordPress-style filters: date, category, Filter button */}
        <div className="v-filters" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            aria-label={t('blogs', 'filterByDate') || 'Filter by date'}
          >
            <option value="">{t('blogs', 'allDates') || 'All dates'}</option>
            {(() => {
              // Generate last 12 months
              const months = [];
              const now = new Date();
              for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
                months.push(
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              }
              return months;
            })()}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            aria-label={t('blogs', 'filterByCategory') || 'Filter by category'}
          >
            <option value="">{t('blogs', 'allCategories') || 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="v-btn"
            onClick={() => {
              setPage(1);
              void load();
            }}
          >
            {t('common', 'filter') || 'Filter'}
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

      <div className="v-list-table-wrap">
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
            {cols.comments ? <th style={{ textAlign: 'center' }}>💬</th> : null}
            <th>{t('blogs', 'status')}</th>
            {cols.date ? <th>{t('blogs', 'date')}</th> : null}
            {cols.seo ? <th>{t('blogs', 'seoDetails') || 'SEO Details'}</th> : null}
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
                (cols.comments ? 1 : 0) +
                (cols.date ? 1 : 0) +
                (cols.seo ? 1 : 0);
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
                      <Link href={`/content/posts/${p.translations?.[0]?.slug || p.id}`} className="row-title">
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
                            <Link href={`/content/posts/${p.translations?.[0]?.slug || p.id}`}>{t('common', 'edit') || 'Edit'}</Link>
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
                          {' | '}
                          <span>
                            <Link href={`/content/posts/${p.translations?.[0]?.slug || p.id}?preview=1`} target="_blank" rel="noreferrer">
                              {t('common', 'view') || 'View'}
                            </Link>
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  {cols.author ? <td>{p.author?.name || p.author?.email || '—'}</td> : null}
                  {cols.categories ? (
                    <td>
                      {(p.categories ?? []).length > 0
                        ? (p.categories ?? []).map((c) => (
                            <span key={c.id}>
                              <Link href={`/content/posts?category=${c.id}`}>
                                {c.translations?.[0]?.name || c.id}
                              </Link>{' '}
                            </span>
                          ))
                        : '—'}
                    </td>
                  ) : null}
                  {cols.tags ? (
                    <td>
                      {(p.tags ?? []).length > 0
                        ? (p.tags ?? []).map((tg) => (
                            <span key={tg.id}>
                              <Link href={`/content/posts?tag=${tg.id}`}>
                                {tg.translations?.[0]?.name || tg.id}
                              </Link>{' '}
                            </span>
                          ))
                        : '—'}
                    </td>
                  ) : null}
                  {cols.comments ? (
                    <td style={{ textAlign: 'center' }}>
                      <Link href={`/comments?post=${p.id}`} title={t('blogs', 'comments') || 'Comments'}>
                        {(p as { _count?: { comments?: number } })._count?.comments ?? '—'}
                      </Link>
                    </td>
                  ) : null}
                  <td>{p.status}</td>
                  {cols.date ? (
                    <td>{p.publishedAt || p.updatedAt || '—'}</td>
                  ) : null}
                  {cols.seo ? (
                    <td>
                      {(() => {
                        // Basic SEO score: title + excerpt + featured image
                        const tr = p.translations?.[0];
                        let score = 0;
                        if (tr?.title && tr.title.length >= 10) score += 40;
                        if ((p as { excerpt?: string }).excerpt) score += 30;
                        if ((p as { seoTitle?: string }).seoTitle) score += 15;
                        if ((p as { seoDescription?: string }).seoDescription) score += 15;
                        const color = score >= 70 ? '#46b450' : score >= 40 ? '#ffb900' : '#dc3232';
                        return (
                          <span
                            style={{
                              display: 'inline-block',
                              background: color,
                              color: '#fff',
                              padding: '2px 8px',
                              borderRadius: 3,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                            title={`${score}/100`}
                          >
                            {score} / 100
                          </span>
                        );
                      })()}
                    </td>
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
      </div>
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
