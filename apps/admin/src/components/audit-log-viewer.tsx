'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'security' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('security', key);
  if (!v || v === key || v.startsWith('security.')) return fallback;
  return v;
}

type Row = {
  id: string;
  action: string;
  actorEmail: string | null;
  actorId: string | null;
  entityType: string | null;
  entityId: string | null;
  ip: string | null;
  createdAt: string;
};

export function AuditLogViewer() {
  const { t } = useMessages();
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/audit?limit=50', { credentials: 'include' });
    if (!res.ok) {
      setError(L(t, 'loadFailedStatus', `Load failed (${res.status})`).replace('{status}', String(res.status)));
      return;
    }
    const data = (await res.json()) as { items: Row[] };
    setItems(data.items ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={() => void load()} style={{ fontSize: 13 }}>
          {t('common', 'refresh') || 'Refresh'}
        </button>
      </div>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      ) : null}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: 8 }}>{L(t, 'when', 'When')}</th>
            <th style={{ padding: 8 }}>{L(t, 'action', 'Action')}</th>
            <th style={{ padding: 8 }}>{L(t, 'actor', 'Actor')}</th>
            <th style={{ padding: 8 }}>{L(t, 'entity', 'Entity')}</th>
            <th style={{ padding: 8 }}>{L(t, 'ip', 'IP')}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 12, color: 'var(--muted)' }}>
                {L(t, 'noAuditEvents', 'No audit events yet. Activate a theme or moderate a comment to generate events.')}
              </td>
            </tr>
          ) : (
            items.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 8, fontSize: 12 }}>
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 12 }}>{r.action}</td>
                <td style={{ padding: 8, fontSize: 12 }}>
                  {r.actorEmail ?? (r.actorId ? r.actorId.slice(0, 8) : '—')}
                </td>
                <td style={{ padding: 8, fontSize: 12 }}>
                  {r.entityType}
                  {r.entityId ? `/${r.entityId.slice(0, 10)}` : ''}
                </td>
                <td style={{ padding: 8, fontSize: 12 }}>{r.ip ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
