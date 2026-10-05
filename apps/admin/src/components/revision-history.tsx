'use client';

import { useCallback, useEffect, useState } from 'react';
import { listRevisionsAction, restoreRevisionAction } from '@/actions/posts';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'posts' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('posts', key);
  if (!v || v === key || v.startsWith('posts.')) return fallback;
  return v;
}

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
  const { t } = useMessages();
  const [items, setItems] = useState<Rev[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await listRevisionsAction(postId);
    if (!result.ok) {
      setError(result.error || L(t, 'loadRevisionsFailed', 'Failed to load revisions'));
      return;
    }
    setItems((result.data.items as Rev[]) ?? []);
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(revisionId: string) {
    if (!confirm(L(t, 'restoreRevisionConfirm', 'Restore this revision? Current content will be replaced.'))) return;
    setBusy(true);
    setError(null);
    const result = await restoreRevisionAction(postId, revisionId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? L(t, 'restoreFailed', 'Restore failed'));
      return;
    }
    await load();
    onRestored?.();
    window.location.reload();
  }

  return (
    <section className="v-panel">
      <h2 className="v-panel__h">{L(t, 'revisions', 'Revisions')}</h2>
      <div className="v-panel__b">
        {error ? <div className="v-alert v-alert--error">{error}</div> : null}
        {items.length === 0 ? (
          <p className="v-muted" style={{ margin: 0 }}>
            {L(t, 'noRevisions', 'No revisions yet. They appear after saves.')}
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
                  <strong>{r.title || L(t, 'noTitle', '(no title)')}</strong>
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
                  {L(t, 'restore', 'Restore')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
