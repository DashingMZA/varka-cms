'use client';

import { useCallback, useEffect, useState } from 'react';

type Rev = {
  id: string;
  title: string | null;
  note: string | null;
  createdAt: string;
};

export function RevisionHistory({
  postId,
  onRestored,
}: {
  postId: string;
  onRestored?: () => void;
}) {
  const [items, setItems] = useState<Rev[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/posts/${postId}/revisions`, { credentials: 'include' });
    if (!res.ok) {
      setError(`Failed to load revisions (${res.status})`);
      return;
    }
    const data = (await res.json()) as { items: Rev[] };
    setItems(data.items ?? []);
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(revisionId: string) {
    if (!confirm('Restore this revision? Current content will be replaced.')) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/posts/${postId}/revisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ revisionId }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'Restore failed');
      return;
    }
    await load();
    onRestored?.();
    window.location.reload();
  }

  return (
    <section className="v-panel">
      <h2 className="v-panel__h">Revisions</h2>
      <div className="v-panel__b">
        {error ? <div className="v-alert v-alert--error">{error}</div> : null}
        {items.length === 0 ? (
          <p className="v-muted" style={{ margin: 0 }}>
            No revisions yet. They appear after saves.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 220, overflow: 'auto' }}>
            {items.map((r) => (
              <li
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '6px 0',
                  borderBottom: '1px solid #f0f0f1',
                  fontSize: 12,
                }}
              >
                <span>
                  <strong>{r.title || '(no title)'}</strong>
                  <br />
                  <span className="v-muted">{new Date(r.createdAt).toLocaleString()}</span>
                  {r.note ? <span className="v-muted"> · {r.note}</span> : null}
                </span>
                <button
                  type="button"
                  className="v-btn"
                  disabled={busy}
                  onClick={() => void restore(r.id)}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
