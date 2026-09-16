'use client';

import { useEffect, useState } from 'react';

export function AutosaveSettings() {
  const [ms, setMs] = useState(2500);
  const [min, setMin] = useState(1000);
  const [max, setMax] = useState(120000);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/settings/autosave', { credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as {
        intervalMs: number;
        minMs: number;
        maxMs: number;
      };
      setMs(data.intervalMs);
      setMin(data.minMs);
      setMax(data.maxMs);
    })();
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const res = await fetch('/api/settings/autosave', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ intervalMs: ms }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(body.error ?? 'Save failed');
      setBusy(false);
      return;
    }
    const data = (await res.json()) as { intervalMs: number };
    setMs(data.intervalMs);
    setMsg(`Autosave interval set to ${(data.intervalMs / 1000).toFixed(1)}s`);
    setBusy(false);
  }

  return (
    <section className="v-panel">
      <h2 className="v-panel__h">Autosave</h2>
      <div className="v-panel__b">
        <p className="v-muted" style={{ marginTop: 0 }}>
          Delay before drafts are saved automatically (WordPress-style). Empty titles are never
          saved.
        </p>
        <label style={{ display: 'grid', gap: 6, maxWidth: 280, fontWeight: 600 }}>
          Interval (seconds)
          <input
            type="number"
            min={min / 1000}
            max={max / 1000}
            step={0.5}
            value={ms / 1000}
            onChange={(e) => setMs(Math.round(Number(e.target.value) * 1000))}
            style={{ fontWeight: 400, padding: 8, border: '1px solid var(--wp-border)' }}
          />
        </label>
        <p className="v-muted" style={{ fontSize: 12 }}>
          Allowed range: {min / 1000}s – {max / 1000}s
        </p>
        {msg ? <div className="v-alert v-alert--ok">{msg}</div> : null}
        {err ? <div className="v-alert v-alert--error">{err}</div> : null}
        <button type="button" className="v-btn v-btn--primary" disabled={busy} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </section>
  );
}
