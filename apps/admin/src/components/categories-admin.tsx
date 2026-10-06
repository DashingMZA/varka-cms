'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  listCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/actions/taxonomy';

type Row = {
  id: string;
  parentId?: string | null;
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

/** WordPress-style Categories: Add form left, table right, with Edit/Quick Edit/Delete/View. */
export function CategoriesAdmin() {
  const [items, setItems] = useState<Row[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bulk, setBulk] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Quick Edit state
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [qeName, setQeName] = useState('');
  const [qeSlug, setQeSlug] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await listCategoriesAction();
      if (result.ok) {
        setItems((result.data.items as Row[]) ?? []);
      }
    } catch {
      setError('Failed to load');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    const result = await createCategoryAction({
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      parentId: parentId || undefined,
    });
    if (!result.ok) {
      setError(result.error || 'Failed to create');
      return;
    }
    setName('');
    setSlug('');
    setSlugTouched(false);
    setDescription('');
    setParentId('');
    await load();
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this category?')) return;
    const result = await deleteCategoryAction(id);
    if (!result.ok) {
      setError(result.error || 'Delete failed');
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
    const result = await updateCategoryAction(quickEditId, {
      name: qeName.trim(),
      slug: qeSlug.trim(),
    });
    if (!result.ok) {
      setError(result.error || 'Update failed');
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

  // Build hierarchy display with indentation
  const byParent = new Map<string | null, Row[]>();
  for (const r of paged) {
    const pid = r.parentId || null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(r);
  }

  function renderRows(rows: Row[], depth: number): React.ReactNode[] {
    const out: React.ReactNode[] = [];
    for (const r of rows) {
      const prefix = depth > 0 ? '— '.repeat(depth) : '';
      const isQe = quickEditId === r.id;
      out.push(
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
                  placeholder="Name"
                  style={{ minWidth: 120 }}
                />
                <input
                  value={qeSlug}
                  onChange={(e) => setQeSlug(e.target.value)}
                  placeholder="Slug"
                  style={{ minWidth: 100 }}
                />
                <button type="button" className="v-btn v-btn--small v-btn--primary" onClick={() => void saveQuickEdit()}>
                  Update
                </button>
                <button type="button" className="v-btn v-btn--small" onClick={() => setQuickEditId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <strong>
                  <Link href={`/content/categories/${r.id}`} className="row-title">
                    {prefix}{r.translations[0]?.name ?? r.id}
                  </Link>
                </strong>
                <div className="row-actions">
                  <span><Link href={`/content/categories/${r.id}`}>Edit</Link></span>
                  {' | '}
                  <span>
                    <a href="#" onClick={(e) => { e.preventDefault(); openQuickEdit(r); }}>
                      Quick Edit
                    </a>
                  </span>
                  {' | '}
                  <span>
                    <a href="#" className="trash" onClick={(e) => { e.preventDefault(); void onDelete(r.id); }}>
                      Delete
                    </a>
                  </span>
                  {' | '}
                  <span><Link href={`/category/${r.translations[0]?.slug}`}>View</Link></span>
                </div>
              </>
            )}
          </td>
          <td className="v-muted">{r.translations[0]?.description || '—'}</td>
          <td className="v-muted">{r.translations[0]?.slug}</td>
          <td>
            <Link href={`/content/posts?category=${r.id}`}>{r._count?.posts ?? 0}</Link>
          </td>
        </tr>
      );
      const children = byParent.get(r.id) || [];
      out.push(...renderRows(children, depth + 1));
    }
    return out;
  }

  const topLevel = byParent.get(null) || [];

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Categories</h1>
      </div>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Add Category form (WordPress-style) */}
        <div className="v-card" style={{ padding: 16 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14 }}>Add Category</h2>
          <form onSubmit={onCreate}>
            <p className="v-field">
              <label htmlFor="cat-name">Name</label>
              <input
                id="cat-name"
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  if (!slugTouched) setSlug(slugify(v));
                }}
                placeholder="Category name"
                required
                style={{ width: '100%' }}
              />
              <span className="v-muted" style={{ fontSize: 12 }}>The name is how it appears on your site.</span>
            </p>
            <p className="v-field">
              <label htmlFor="cat-slug">Slug</label>
              <input
                id="cat-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="category-slug"
                style={{ width: '100%' }}
              />
              <span className="v-muted" style={{ fontSize: 12 }}>
                The "slug" is the URL-friendly version of the name.
              </span>
            </p>
            <p className="v-field">
              <label htmlFor="cat-parent">Parent Category</label>
              <select
                id="cat-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">None</option>
                {items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.translations[0]?.name}
                  </option>
                ))}
              </select>
              <span className="v-muted" style={{ fontSize: 12 }}>
                Categories can have a hierarchy.
              </span>
            </p>
            <p className="v-field">
              <label htmlFor="cat-desc">Description</label>
              <textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ width: '100%' }}
              />
            </p>
            <p>
              <button type="submit" className="v-btn v-btn--primary">
                Add Category
              </button>
            </p>
          </form>
        </div>

        {/* Right: Table */}
        <div>
          <div className="v-list-table-top" style={{ marginBottom: 12 }}>
            <div className="v-bulk">
              <select value={bulk} onChange={(e) => setBulk(e.target.value)}>
                <option value="">Bulk actions</option>
                <option value="delete">Delete</option>
              </select>
              <button
                type="button"
                className="v-btn"
                disabled={!bulk || selected.size === 0}
                onClick={async () => {
                  if (bulk === 'delete' && confirm(`Delete ${selected.size} categories?`)) {
                    for (const id of selected) {
                      await deleteCategoryAction(id);
                    }
                    setSelected(new Set());
                    setBulk('');
                    await load();
                  }
                }}
              >
                Apply
              </button>
            </div>
            <div className="v-search">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search categories..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(q);
                    setPage(1);
                  }
                }}
              />
              <button type="button" className="v-btn" onClick={() => { setSearch(q); setPage(1); }}>
                Search Categories
              </button>
            </div>
          </div>

          <div className="v-muted" style={{ marginBottom: 8, textAlign: 'right' }}>
            {filtered.length} items
            {totalPages > 1 ? (
              <span style={{ marginInlineStart: 12 }}>
                <button className="v-btn v-btn--small" disabled={page <= 1} onClick={() => setPage(1)}>«</button>
                <button className="v-btn v-btn--small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                <span style={{ margin: '0 8px' }}>{page} of {totalPages}</span>
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
                <th>Name</th>
                <th>Description</th>
                <th>Slug</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={5} className="v-muted">No categories found.</td></tr>
              ) : (
                renderRows(topLevel, 0)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
