'use client';

import { useCallback, useEffect, useState } from 'react';

type PostRow = {
  id: string;
  status: string;
  updatedAt: string;
  translations: Array<{ title: string; slug: string; languageId: string }>;
};

export function PostsAdmin() {
  const [items, setItems] = useState<PostRow[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/posts', { credentials: 'include' });
    if (!res.ok) {
      setError(`Failed to load posts (${res.status})`);
      return;
    }
    const data = (await res.json()) as { items: PostRow[] };
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPost() {
    setLoading(true);
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
        setLoading(false);
        return;
      }
      setTitle('');
      await load();
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          placeholder="New post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}
        />
        <button
          type="button"
          disabled={loading || !title.trim()}
          onClick={() => void createPost()}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Create
        </button>
      </div>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: 10 }}>Title</th>
            <th style={{ padding: 10 }}>Slug</th>
            <th style={{ padding: 10 }}>Status</th>
            <th style={{ padding: 10 }}>Updated</th>
            <th style={{ padding: 10 }} />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 16, color: 'var(--muted)' }}>
                No posts yet.
              </td>
            </tr>
          ) : (
            items.map((p) => {
              const tr = p.translations[0];
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 10 }}>{tr?.title ?? '—'}</td>
                  <td style={{ padding: 10, fontFamily: 'monospace', fontSize: 13 }}>
                    {tr?.slug ?? '—'}
                  </td>
                  <td style={{ padding: 10 }}>{p.status}</td>
                  <td style={{ padding: 10, fontSize: 13 }}>
                    {new Date(p.updatedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: 10 }}>
                    <a href={`/content/posts/${p.id}`}>Edit</a>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
