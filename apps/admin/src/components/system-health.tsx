'use client';

import { useCallback, useEffect, useState } from 'react';

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
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const body = (await res.json()) as Health;
      setData(body);
      if (!res.ok) setError(`Health ${res.status}`);
      else setError(null);
    } catch {
      setError('Network error');
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  if (!data && !error) return <p style={{ color: 'var(--muted)' }}>Loading health…</p>;

  return (
    <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        <Card label="Status" value={data?.ok ? 'OK' : 'DEGRADED'} warn={!data?.ok} />
        <Card label="Cache" value={String(data?.cache ?? '—')} />
        <Card label="Database" value={String(data?.database ?? '—')} warn={data?.database === 'down'} />
        <Card
          label="Queue depth"
          value={data?.queueDepth !== undefined ? String(data.queueDepth) : '—'}
        />
      </div>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
        Last check: {data?.time ? new Date(data.time).toLocaleString() : '—'} ·{' '}
        <button type="button" onClick={() => void load()} style={{ fontSize: 12 }}>
          Refresh
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
