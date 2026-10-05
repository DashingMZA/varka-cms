'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'dashboard' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('dashboard', key);
  if (!v || v === key || v.startsWith('dashboard.')) return fallback;
  return v;
}

type Health = {
  ok?: boolean;
  cache?: string;
  cachePing?: boolean;
  database?: string;
  queue?: string;
  queueDepth?: number;
  time?: string;
  error?: string;
};

export function SystemHealth() {
  const { t } = useMessages();
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const body = (await res.json()) as Health;
      setData(body);
      if (!res.ok) setError(L(t, 'healthStatus', `Health ${res.status}`).replace('{status}', String(res.status)));
      else setError(null);
    } catch {
      setError(L(t, 'networkError', 'Network error'));
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  if (!data && !error)
    return <p style={{ color: 'var(--muted)' }}>{L(t, 'loadingHealth', 'Loading health…')}</p>;

  return (
    <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        <Card
          label={L(t, 'status', 'Status')}
          value={data?.ok ? L(t, 'healthOk', 'OK') : L(t, 'healthDegraded', 'DEGRADED')}
          warn={!data?.ok}
        />
        <Card label={L(t, 'cache', 'Cache')} value={String(data?.cache ?? '—')} />
        <Card
          label={L(t, 'database', 'Database')}
          value={String(data?.database ?? '—')}
          warn={data?.database === 'down'}
        />
        <Card
          label={L(t, 'queueDepth', 'Queue depth')}
          value={data?.queueDepth !== undefined ? String(data.queueDepth) : '—'}
        />
      </div>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
        {L(t, 'lastCheck', 'Last check:')} {data?.time ? new Date(data.time).toLocaleString() : '—'} ·{' '}
        <button type="button" onClick={() => void load()} style={{ fontSize: 12 }}>
          {t('common', 'refresh') || 'Refresh'}
        </button>
      </p>
    </div>
  );
}

function Card({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: warn ? 'var(--danger)' : undefined }}>
        {value}
      </div>
    </div>
  );
}
