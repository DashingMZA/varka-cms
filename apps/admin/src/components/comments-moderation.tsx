'use client';

import { useCallback, useEffect, useState } from 'react';

type CommentRow = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  createdAt: string;
  post?: { translations?: Array<{ title: string; slug: string }> };
};

type Counts = { pending: number; approved: number; spam: number; trash: number };

export function CommentsModeration() {
  const [items, setItems] = useState<CommentRow[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [filter, setFilter] = useState<string>('PENDING');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = filter ? `?status=${filter}` : '';
    const [listRes, countRes] = await Promise.all([
      fetch(`/api/comments${q}`, { credentials: 'include' }),
      fetch('/api/comments?counts=1', { credentials: 'include' }),
    ]);
    if (!listRes.ok) {
      setError(`Load failed (${listRes.status})`);
      return;
    }
    const data = (await listRes.json()) as { items: CommentRow[] };
    setItems(data.items ?? []);
    if (countRes.ok) {
      setCounts((await countRes.json()) as Counts);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError(`Update failed (${res.status})`);
      return;
    }
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete permanently?')) return;
    const res = await fetch(`/api/comments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      setError(`Delete failed (${res.status})`);
      return;
    }
    await load();
  }

  return (
    <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
      {counts ? (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
          <span>Pending: <strong>{counts.pending}</strong></span>
          <span>Approved: <strong>{counts.approved}</strong></span>
          <span>Spam: <strong>{counts.spam}</strong></span>
          <span>Trash: <strong>{counts.trash}</strong></span>
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['PENDING', 'APPROVED', 'SPAM', 'TRASH'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: filter === s ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: '#fff',
              fontSize: 13,
            }}
          >
            {s}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      <div style={{ display: 'grid', gap: 10 }}>
        {items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No comments in this filter.</p>
        ) : (
          items.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--ink)' }}>{c.authorName}</strong>
                {c.authorEmail ? ` · ${c.authorEmail}` : ''} · {c.status} ·{' '}
                {new Date(c.createdAt).toLocaleString()}
              </div>
              <p style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{c.body}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {c.status !== 'APPROVED' ? (
                  <button type="button" style={btn} onClick={() => void setStatus(c.id, 'APPROVED')}>
                    Approve
                  </button>
                ) : null}
                {c.status !== 'SPAM' ? (
                  <button type="button" style={btnMuted} onClick={() => void setStatus(c.id, 'SPAM')}>
                    Spam
                  </button>
                ) : null}
                {c.status !== 'TRASH' ? (
                  <button type="button" style={btnMuted} onClick={() => void setStatus(c.id, 'TRASH')}>
                    Trash
                  </button>
                ) : null}
                <button type="button" style={btnDanger} onClick={() => void remove(c.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const btn: Record<string, string | number> = {
  padding: '6px 10px',
  borderRadius: 6,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
};
const btnMuted: Record<string, string | number> = {
  ...btn,
  background: '#fff',
  color: 'var(--ink)',
  border: '1px solid var(--border)',
};
const btnDanger: Record<string, string | number> = {
  ...btn,
  background: '#fff',
  color: 'var(--danger)',
  border: '1px solid var(--border)',
};
