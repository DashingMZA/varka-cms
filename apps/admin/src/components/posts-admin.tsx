'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Featured = {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  storage: string;
  alt?: string | null;
};

type PostRow = {
  id: string;
  status: string;
  updatedAt: string;
  createdAt?: string;
  translations: Array<{ title: string; slug: string; languageId: string }>;
  author?: { name?: string | null; email?: string | null } | null;
  categories?: Array<{ category: { translations?: Array<{ name: string }> } }>;
  tags?: Array<{ tag: { translations?: Array<{ name: string }> } }>;
  featuredImage?: Featured | null;
};

type StatusFilter = 'all' | 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'TRASHED';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_REVIEW', label: 'Pending' },
  { key: 'TRASHED', label: 'Trash' },
];

function statusClass(status: string): string {
  return `v-status v-status--${status.toLowerCase()}`;
}

function namesFromCats(p: PostRow): string {
  return (
    (p.categories ?? [])
      .map((c) => c.category.translations?.[0]?.name)
      .filter(Boolean)
      .join(', ') || '—'
  );
}

function namesFromTags(p: PostRow): string {
  return (
    (p.tags ?? [])
      .map((t) => t.tag.translations?.[0]?.name)
      .filter(Boolean)
      .join(', ') || '—'
  );
}

function thumbUrl(a: Featured): string {
  if (a.storage === 'local') return `/api/media/file/${a.key}`;
  return a.key.startsWith('http') ? a.key : `/api/media/file/${a.key}`;
}

function normalizeRows(raw: unknown[]): PostRow[] {
  return (raw as PostRow[]).map((p) => ({
    ...p,
    updatedAt:
      typeof p.updatedAt === 'string'
        ? p.updatedAt
        : new Date(p.updatedAt as unknown as Date).toISOString(),
  }));
}

export function PostsAdmin({ initialItems = [] }: { initialItems?: PostRow[] }) {
  const router = useRouter();
  const seed = normalizeRows(initialItems);
  const [items, setItems] = useState<PostRow[]>(seed);
  const [allForCounts, setAllForCounts] = useState<PostRow[]>(seed);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(seed.length > 0);

  const load = useCallback(async (filter: StatusFilter) => {
    setError(null);
    const q =
      filter === 'all' ? '/api/posts?limit=100' : `/api/posts?limit=100&status=${filter}`;
    const res = await fetch(q, { credentials: 'include' });
    if (!res.ok) {
      setError(`Failed to load posts (${res.status})`);
      return;
    }
    const data = (await res.json()) as { items: PostRow[] };
    setItems(data.items ?? []);
    setSelected(new Set());
    setHydrated(true);
  }, []);

  const loadCounts = useCallback(async () => {
    const res = await fetch('/api/posts?limit=100', { credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as { items: PostRow[] };
    setAllForCounts(data.items ?? []);
  }, []);

  useEffect(() => {
    if (status === 'all' && hydrated && seed.length > 0) {
      setItems(seed);
      return;
    }
    void load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, status]);

  useEffect(() => {
    if (seed.length > 0) {
      setAllForCounts(seed);
      return;
    }
    void loadCounts();
  }, [loadCounts, seed.length]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allForCounts.length };
    for (const p of allForCounts) {
      c[p.status] = (c[p.status] ?? 0) + 1;
    }
    return c;
  }, [allForCounts]);

  const filtered = useMemo(() => {
    let rows = items;
    if (status !== 'all') {
      rows = rows.filter((p) => p.status === status);
    }
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => {
      const tr = p.translations[0];
      const hay =
        `${tr?.title ?? ''} ${tr?.slug ?? ''} ${p.status} ${namesFromCats(p)} ${namesFromTags(p)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, status]);

  const allChecked = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleAll(on: boolean) {
    if (!on) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filtered.map((p) => p.id)));
  }

  function toggleOne(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function createPost() {
    // WP-style: open empty editor — no DB row until Save
    router.push('/content/posts/new');
  }

  async function trashOne(id: string, languageId?: string) {
    if (!confirm('Move this post to Trash?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ languageId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Trash failed (${res.status})`);
      } else {
        await load(status);
        await loadCounts();
      }
    } catch {
      setError('Network error');
    }
    setBusy(false);
  }

  async function applyBulk() {
    if (!bulk || selected.size === 0) return;
    if (bulk === 'trash' && !confirm(`Move ${selected.size} post(s) to Trash?`)) return;
    setBusy(true);
    setError(null);
    try {
      if (bulk === 'trash') {
        for (const id of selected) {
          const row = items.find((p) => p.id === id);
          await fetch(`/api/posts/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ languageId: row?.translations[0]?.languageId }),
          });
        }
      }
      await load(status);
      await loadCounts();
      setBulk('');
    } catch {
      setError('Bulk action failed');
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Posts</h1>
        <button type="button" className="v-btn v-btn--primary" disabled={busy} onClick={createPost}>
          Add New
        </button>
      </div>

      <ul className="v-subsub">
        {STATUS_TABS.map((t) => {
          const n = t.key === 'all' ? (counts.all ?? 0) : (counts[t.key] ?? 0);
          return (
            <li key={t.key}>
              <a
                href="#"
                className={status === t.key ? 'is-current' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setStatus(t.key);
                  setSearch('');
                  setSearchInput('');
                }}
              >
                {t.label} <span className="count">({n})</span>
              </a>
            </li>
          );
        })}
      </ul>

      <div className="v-tablenav">
        <select value={bulk} onChange={(e) => setBulk(e.target.value)} aria-label="Bulk actions">
          <option value="">Bulk actions</option>
          <option value="trash">Move to Trash</option>
        </select>
        <button
          type="button"
          className="v-btn"
          disabled={!bulk || selected.size === 0 || busy}
          onClick={() => void applyBulk()}
        >
          Apply
        </button>
        <span className="v-tablenav" style={{ marginLeft: 'auto', margin: 0 }}>
          <input
            type="search"
            placeholder="Search posts…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearch(searchInput);
            }}
          />
          <button type="button" className="v-btn" onClick={() => setSearch(searchInput)}>
            Search Posts
          </button>
        </span>
      </div>

      {error ? (
        <div className="v-alert v-alert--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="v-table-wrap">
        <table className="v-table">
          <thead>
            <tr>
              <td className="check-col">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleAll(e.target.checked)}
                  aria-label="Select all"
                />
              </td>
              <th style={{ width: 52 }}>Image</th>
              <th>Title</th>
              <th>Author</th>
              <th>Categories</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 20, color: 'var(--wp-muted)' }}>
                  No posts found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const tr = p.translations[0];
                const checked = selected.has(p.id);
                const img = p.featuredImage;
                return (
                  <tr key={p.id}>
                    <th className="check-col" scope="row">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleOne(p.id, e.target.checked)}
                        aria-label={`Select ${tr?.title ?? p.id}`}
                      />
                    </th>
                    <td>
                      {img ? (
                        <img
                          src={thumbUrl(img)}
                          alt={img.alt ?? img.filename}
                          width={40}
                          height={40}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: 'cover',
                            borderRadius: 3,
                            border: '1px solid var(--wp-border)',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <span className="v-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/content/posts/${p.id}`} className="row-title">
                        {tr?.title ?? '—'}
                      </Link>
                      <div className="row-actions">
                        <Link href={`/content/posts/${p.id}`}>Edit</Link>
                        <a
                          href="#"
                          className="trash"
                          onClick={(e) => {
                            e.preventDefault();
                            void trashOne(p.id, tr?.languageId);
                          }}
                        >
                          Trash
                        </a>
                        <span className="v-muted" style={{ fontFamily: 'monospace' }}>
                          {tr?.slug ?? ''}
                        </span>
                      </div>
                    </td>
                    <td>{p.author?.name || p.author?.email || '—'}</td>
                    <td>{namesFromCats(p)}</td>
                    <td>{namesFromTags(p)}</td>
                    <td>
                      <span className={statusClass(p.status)}>
                        {p.status.replaceAll('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <span className="v-muted">{new Date(p.updatedAt).toLocaleString()}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="v-tablenav">
        <span className="v-muted">
          {filtered.length} item{filtered.length === 1 ? '' : 's'}
          {selected.size > 0 ? ` · ${selected.size} selected` : ''}
        </span>
      </div>
    </div>
  );
}
