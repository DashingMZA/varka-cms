'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMessages } from '@/lib/i18n';
import {
  listTagsAction,
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from '@/actions/taxonomy';

type Row = {
  id: string;
  translations: { name: string; slug: string; description?: string | null }[];
  _count?: { posts: number };
};

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || ''
  );
}

/** WordPress-style Tags: Add form left, table right, with Edit/Quick Edit/Delete/View. */
export function TagsAdmin({ initialItems = [] }: { initialItems?: Row[] }) {
  const { t } = useMessages();
  const [items, setItems] = useState<Row[]>(initialItems);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bulk, setBulk] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [hydrated, setHydrated] = useState(false);

  // Quick Edit state
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [qeName, setQeName] = useState('');
  const [qeSlug, setQeSlug] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await listTagsAction();
      if (result.ok) {
        setItems((result.data.items as Row[]) ?? []);
      } else {
        setError(result.error || t('tags', 'loadFailed'));
      }
    } catch {
      setError(t('tags', 'loadFailed'));
    }
  }, []);

  useEffect(() => {
    // Skip first fetch when server provided initial data
    if (!hydrated && initialItems.length > 0) {
      setHydrated(true);
      return;
    }
    void load();
  }, [load, hydrated, initialItems.length]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    const result = await createTagAction({
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
    });
    if (!result.ok) {
      setError(result.error || t('tags', 'createFailed'));
      return;
    }
    setName('');
    setSlug('');
    setSlugTouched(false);
    setDescription('');
    await load();
  }

  async function onDelete(id: string) {
    if (!confirm(t('tags', 'deleteConfirm'))) return;
    const result = await deleteTagAction(id);
    if (!result.ok) {
      setError(result.error || t('tags', 'deleteFailed'));
      return;
    }
    await load();
  }

  function openQuickEdit(row: Row) {
    setQuickEditId(row.id);
    setQeName(row.translations[0]?.name || '');
    setQeSlug(row.translations[0]?.slug || '');
  }

  async function saveQuickEdit() {
    if (!quickEditId) return;
    const result = await updateTagAction(quickEditId, {
      name: qeName.trim(),
      slug: qeSlug.trim(),
    });
    if (!result.ok) {
      setError(result.error || t('tags', 'updateFailed'));
      return;
    }
    setQuickEditId(null);
    await load();
  }

  const filtered = items.filter((r) => {
    if (!search.trim()) return true;
    const n = r.translations[0]?.name?.toLowerCase() ?? '';
    const s = r.translations[0]?.slug?.toLowerCase() ?? '';
    const ql = search.toLowerCase();
    return n.includes(ql) || s.includes(ql);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{t('tags', 'title')}</h1>
      </div>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Add Tag form (WordPress-style) */}
        <div className="v-card" style={{ padding: 16 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14 }}>{t('tags', 'addTag')}</h2>
          <form onSubmit={onCreate}>
            <p className="v-field">
              <label htmlFor="tag-name">{t('tags', 'name')}</label>
              <input
                id="tag-name"
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  if (!slugTouched) setSlug(slugify(v));
                }}
                placeholder={t('tags', 'namePlaceholder')}
                required
                style={{ width: '100%' }}
              />
              <span className="v-muted" style={{ fontSize: 12 }}>
                {t('tags', 'nameHelp')}
              </span>
            </p>
            <p className="v-field">
              <label htmlFor="tag-slug">{t('tags', 'slug')}</label>
              <input
                id="tag-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="tag-slug"
                style={{ width: '100%' }}
              />
              <span className="v-muted" style={{ fontSize: 12 }}>
                {t('tags', 'slugHelp')}
              </span>
            </p>
            <p className="v-field">
              <label htmlFor="tag-desc">{t('tags', 'description')}</label>
              <textarea
                id="tag-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{ width: '100%' }}
              />
              <span className="v-muted" style={{ fontSize: 12 }}>
                {t('tags', 'descriptionHelp')}
              </span>
            </p>
            <p>
              <button type="submit" className="v-btn v-btn--primary">
                {t('tags', 'addTag')}
              </button>
            </p>
          </form>
        </div>

        {/* Right: Table */}
        <div>
          <div className="v-list-table-top" style={{ marginBottom: 12 }}>
            <div className="v-bulk">
              <select value={bulk} onChange={(e) => setBulk(e.target.value)}>
                <option value="">{t('common', 'bulkActions')}</option>
                <option value="delete">{t('common', 'delete')}</option>
              </select>
              <button
                type="button"
                className="v-btn"
                disabled={!bulk || selected.size === 0}
                onClick={async () => {
                  if (bulk === 'delete' && confirm(t('tags', 'deleteSelectedConfirm'))) {
                    for (const id of selected) {
                      await deleteTagAction(id);
                    }
                    setSelected(new Set());
                    setBulk('');
                    await load();
                  }
                }}
              >
                {t('common', 'apply')}
              </button>
            </div>
            <div className="v-search">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('tags', 'search')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(q);
                    setPage(1);
                  }
                }}
              />
              <button type="button" className="v-btn" onClick={() => { setSearch(q); setPage(1); }}>
                {t('tags', 'searchTags')}
              </button>
            </div>
          </div>

          <div className="v-muted" style={{ marginBottom: 8, textAlign: 'right' }}>
            {filtered.length} {t('common', 'items')}
            {totalPages > 1 ? (
              <span style={{ marginLeft: 12 }}>
                <button className="v-btn v-btn--small" disabled={page <= 1} onClick={() => setPage(1)}>«</button>
                <button className="v-btn v-btn--small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                <span style={{ margin: '0 8px' }}>{page} {t('common', 'of')} {totalPages}</span>
                <button className="v-btn v-btn--small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                <button className="v-btn v-btn--small" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
              </span>
            ) : null}
          </div>

          <table className="v-list-table">
            <thead>
              <tr>
                <td className="check-column">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selected.size === paged.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(paged.map((r) => r.id)));
                      else setSelected(new Set());
                    }}
                  />
                </td>
                <th>{t('tags', 'name')}</th>
                <th>{t('tags', 'description')}</th>
                <th>{t('tags', 'slug')}</th>
                <th>{t('tags', 'count')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={5} className="v-muted">{t('tags', 'noTags')}</td></tr>
              ) : (
                paged.map((r) => {
                  const isQe = quickEditId === r.id;
                  return (
                    <tr key={r.id}>
                      <th className="check-column">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={(e) => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(r.id);
                              else next.delete(r.id);
                              return next;
                            });
                          }}
                        />
                      </th>
                      <td>
                        {isQe ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              value={qeName}
                              onChange={(e) => setQeName(e.target.value)}
                              placeholder={t('tags', 'name')}
                              style={{ minWidth: 120 }}
                            />
                            <input
                              value={qeSlug}
                              onChange={(e) => setQeSlug(e.target.value)}
                              placeholder={t('tags', 'slug')}
                              style={{ minWidth: 100 }}
                            />
                            <button type="button" className="v-btn v-btn--small v-btn--primary" onClick={() => void saveQuickEdit()}>
                              {t('common', 'update')}
                            </button>
                            <button type="button" className="v-btn v-btn--small" onClick={() => setQuickEditId(null)}>
                              {t('common', 'cancel')}
                            </button>
                          </div>
                        ) : (
                          <>
                            <strong>
                              <Link href={`/content/tags/${r.id}`} className="row-title">
                                {r.translations[0]?.name ?? r.id}
                              </Link>
                            </strong>
                            <div className="row-actions">
                              <span><Link href={`/content/tags/${r.id}`}>{t('common', 'edit')}</Link></span>
                              {' | '}
                              <span>
                                <a href="#" onClick={(e) => { e.preventDefault(); openQuickEdit(r); }}>
                                  {t('tags', 'quickEdit')}
                                </a>
                              </span>
                              {' | '}
                              <span>
                                <a href="#" className="trash" onClick={(e) => { e.preventDefault(); void onDelete(r.id); }}>
                                  {t('common', 'delete')}
                                </a>
                              </span>
                              {' | '}
                              <span><Link href={`/tag/${r.translations[0]?.slug}`}>{t('common', 'view')}</Link></span>
                            </div>
                          </>
                        )}
                      </td>
                      <td className="v-muted">{r.translations[0]?.description || '—'}</td>
                      <td className="v-muted">{r.translations[0]?.slug}</td>
                      <td>
                        <Link href={`/content/posts?tag=${r.id}`}>{r._count?.posts ?? 0}</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
