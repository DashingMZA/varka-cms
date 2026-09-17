'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';

type PageRow = {
  id: string;
  status: string;
  updatedAt: string;
  translations: Array<{ title: string; slug: string }>;
  author?: { name?: string | null; email?: string | null } | null;
};

type Counts = { all: number; published: number; draft: number; trashed: number };

export function PagesAdmin() {
  const [items, setItems] = useState<PageRow[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, published: 0, draft: 0, trashed: 0 });
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (status !== 'all') params.set('status', status.toUpperCase());
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/pages?${params}`, { credentials: 'include' });
      if (!res.ok) {
        setError(`Failed to load (${res.status})`);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { items: PageRow[]; counts?: Counts };
      setItems(data.items ?? []);
      if (data.counts) setCounts(data.counts);
      setSelected(new Set());
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }, [status, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPage() {
    setLoading(true);
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: 'Untitled' }),
      });
      if (!res.ok) {
        setError(`Create failed (${res.status})`);
        setLoading(false);
        return;
      }
      await load();
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  async function applyBulk() {
    if (!bulk || selected.size === 0) return;
    setLoading(true);
    try {
      for (const id of selected) {
        if (bulk === 'trash') {
          await fetch(`/api/pages/${id}`, { method: 'DELETE', credentials: 'include' });
        } else {
          await fetch(`/api/pages/${id}`, {
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
    } catch {
      setError('Bulk action failed');
    }
    setLoading(false);
  }

  return (
    <div>
      <ScreenMeta
        help={[
          {
            id: 'pages',
            title: 'Pages',
            body: 'Pages are hierarchical content. List, filter, and bulk-edit like Posts.',
          },
        ]}
        options={[]}
      />

      <div className="v-page-header">
        <h1 className="v-page-title">Pages</h1>
        <button type="button" className="v-btn v-btn--primary" onClick={() => void createPage()}>
          Add New
        </button>
      </div>

      <ul className="v-subsub">
        {(
          [
            ['all', 'All', counts.all],
            ['published', 'Published', counts.published],
            ['draft', 'Draft', counts.draft],
            ['trashed', 'Trash', counts.trashed],
          ] as const
        ).map(([key, label, n]) => (
          <li key={key}>
            <button
              type="button"
              className={status === key ? 'is-current' : ''}
              onClick={() => setStatus(key)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              {label} <span className="count">({n})</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="v-tablenav">
        <select value={bulk} onChange={(e) => setBulk(e.target.value)}>
          <option value="">Bulk actions</option>
          <option value="publish">Publish</option>
          <option value="draft">Move to Draft</option>
          <option value="trash">Move to Trash</option>
        </select>
        <button
          type="button"
          className="v-btn"
          disabled={!bulk || selected.size === 0}
          onClick={() => void applyBulk()}
        >
          Apply
        </button>
        <input
          type="search"
          placeholder="Search pages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void load();
          }}
        />
        <button type="button" className="v-btn" onClick={() => void load()}>
          Search
        </button>
        {loading ? <span className="v-muted">Loading…</span> : null}
      </div>

      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <div className="v-table-wrap">
        <table className="v-table">
          <thead>
            <tr>
              <th className="check-col">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelected(new Set(items.map((p) => p.id)));
                    else setSelected(new Set());
                  }}
                />
              </th>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="v-muted" style={{ padding: 16 }}>
                  No pages yet.
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const tr = p.translations[0];
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
                      <span className="row-title">{tr?.title || 'Untitled'}</span>
                      <div className="row-actions">
                        <span className="v-muted" style={{ fontSize: 12 }}>
                          /{tr?.slug}
                        </span>
                      </div>
                    </td>
                    <td>{p.author?.name || p.author?.email || '—'}</td>
                    <td>
                      <span className={`v-status v-status--${p.status.toLowerCase()}`}>
                        {p.status.replaceAll('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {new Date(p.updatedAt).toLocaleString()}
                    </td>
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
