'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type PostRow = {
  id: string;
  status: string;
  updatedAt: string;
  createdAt?: string;
  translations: Array<{ title: string; slug: string; languageId: string }>;
  author?: { name?: string | null; email?: string | null } | null;
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
  const s = status.toLowerCase();
  return `v-status v-status--${s}`;
}

export function PostsAdmin() {
  const router = useRouter();
  const [items, setItems] = useState<PostRow[]>([]);
  const [allForCounts, setAllForCounts] = useState<PostRow[]>([]);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newTitle, setNewTitle] = useState('');

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
  }, []);

  const loadCounts = useCallback(async () => {
    const res = await fetch('/api/posts?limit=100', { credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as { items: PostRow[] };
    setAllForCounts(data.items ?? []);
  }, []);

  useEffect(() => {
    void load(status);
  }, [load, status]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allForCounts.length };
    for (const p of allForCounts) {
      c[p.status] = (c[p.status] ?? 0) + 1;
    }
    return c;
  }, [allForCounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      const tr = p.translations[0];
      const hay = `${tr?.title ?? ''} ${tr?.slug ?? ''} ${p.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

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

  async function createPost() {
    const title = newTitle.trim() || 'Untitled';
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Create failed (${res.status})`);
        setBusy(false);
        return;
      }
      const post = (await res.json()) as { id: string };
      router.push(`/content/posts/${post.id}`);
    } catch {
      setError('Network error');
      setBusy(false);
    }
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
        <button
          type="button"
          className="v-btn v-btn--primary"
          disabled={busy}
          onClick={() => {
            setNewTitle('Untitled');
            void createPost();
          }}
        >
          Add New
        </button>
      </div>

      <ul className="v-subsub">
        {STATUS_TABS.map((t) => {
          const n =
            t.key === 'all' ? (counts.all ?? 0) : (counts[t.key] ?? 0);
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
        <button type="button" className="v-btn" disabled={!bulk || selected.size === 0 || busy} onClick={() => void applyBulk()}>
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
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 20, color: 'var(--wp-muted)' }}>
                  No posts found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const tr = p.translations[0];
                const checked = selected.has(p.id);
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
                    <td>
                      <span className={statusClass(p.status)}>{p.status.replaceAll('_', ' ').toLowerCase()}</span>
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
