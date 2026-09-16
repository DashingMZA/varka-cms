'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type PageRow = {
  id: string;
  status: string;
  template?: string;
  updatedAt: string;
  translations: Array<{ title: string; slug: string }>;
  author?: { name?: string | null; email?: string | null } | null;
};

type StatusFilter = 'all' | 'DRAFT' | 'PUBLISHED' | 'TRASHED';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'TRASHED', label: 'Trash' },
];

function statusClass(s: string) {
  return `v-status v-status--${s.toLowerCase()}`;
}

export function PagesAdmin() {
  const router = useRouter();
  const [items, setItems] = useState<PageRow[]>([]);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/pages?limit=100', { credentials: 'include' });
    if (!res.ok) {
      setError(`Failed to load (${res.status})`);
      return;
    }
    const data = (await res.json()) as { items: PageRow[] };
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const p of items) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    let rows = items;
    if (status !== 'all') rows = rows.filter((p) => p.status === status);
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => {
      const tr = p.translations[0];
      return `${tr?.title ?? ''} ${tr?.slug ?? ''}`.toLowerCase().includes(q);
    });
  }, [items, status, search]);

  async function trashOne(id: string) {
    if (!confirm('Move this page to Trash?')) return;
    await fetch(`/api/pages/${id}`, { method: 'DELETE', credentials: 'include' });
    await load();
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Pages</h1>
        <button
          type="button"
          className="v-btn v-btn--primary"
          onClick={() => router.push('/content/pages/new')}
        >
          Add New
        </button>
      </div>

      <ul className="v-subsub">
        {TABS.map((t) => (
          <li key={t.key}>
            <a
              href="#"
              className={status === t.key ? 'is-current' : undefined}
              onClick={(e) => {
                e.preventDefault();
                setStatus(t.key);
              }}
            >
              {t.label} <span className="count">({t.key === 'all' ? counts.all ?? 0 : counts[t.key] ?? 0})</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="v-tablenav">
        <input
          type="search"
          placeholder="Search pages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? <div className="v-alert v-alert--error">{error}</div> : null}

      <div className="v-table-wrap">
        <table className="v-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Template</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 20, color: 'var(--wp-muted)' }}>
                  No pages found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const tr = p.translations[0];
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/content/pages/${p.id}`} className="row-title">
                        {tr?.title ?? '—'}
                      </Link>
                      <div className="row-actions">
                        <Link href={`/content/pages/${p.id}`}>Edit</Link>
                        <a
                          href="#"
                          className="trash"
                          onClick={(e) => {
                            e.preventDefault();
                            void trashOne(p.id);
                          }}
                        >
                          Trash
                        </a>
                        <span className="v-muted" style={{ fontFamily: 'monospace' }}>
                          {tr?.slug}
                        </span>
                      </div>
                    </td>
                    <td>{p.author?.name || p.author?.email || '—'}</td>
                    <td>{p.template ?? 'default'}</td>
                    <td>
                      <span className={statusClass(p.status)}>
                        {p.status.replaceAll('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="v-muted">{new Date(p.updatedAt).toLocaleString()}</td>
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
