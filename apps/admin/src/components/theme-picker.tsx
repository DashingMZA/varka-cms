'use client';

import { useCallback, useEffect, useState } from 'react';

type ThemeRow = {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  tokens?: {
    bg: string;
    ink: string;
    accent: string;
    muted: string;
    card: string;
    border: string;
  };
};

export function ThemePicker() {
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [active, setActive] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/themes', { credentials: 'include' });
    if (!res.ok) {
      setError(`Load failed (${res.status})`);
      return;
    }
    const data = (await res.json()) as { themes: ThemeRow[]; active: string };
    setThemes(data.themes ?? []);
    setActive(data.active);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function activate(themeId: string) {
    setError(null);
    setMessage(null);
    const res = await fetch('/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ themeId }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? `Activate failed (${res.status})`);
      return;
    }
    setMessage(`Activated ${themeId}`);
    await load();
  }

  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      {message ? <p style={{ color: '#15803d', margin: 0 }}>{message}</p> : null}
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
        {themes.length} themes registered (expect 10).
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {themes.map((t) => (
          <div
            key={t.id}
            style={{
              background: 'var(--card)',
              border: t.active ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            {t.tokens ? (
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[t.tokens.bg, t.tokens.card, t.tokens.accent, t.tokens.ink].map((c, i) => (
                  <span
                    key={i}
                    title={c}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: c,
                      border: '1px solid var(--border)',
                    }}
                  />
                ))}
              </div>
            ) : null}
            <div style={{ fontWeight: 700 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{t.id}</div>
            <p style={{ fontSize: 13, margin: '8px 0' }}>{t.description}</p>
            {t.active ? (
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Active</span>
            ) : (
              <button
                type="button"
                onClick={() => void activate(t.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Activate
              </button>
            )}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>
        Active: <code>{active}</code>. Public site:{' '}
        <code>GET /api/public/theme</code> · optional env <code>PUBLIC_THEME_ID</code>.
      </p>
    </div>
  );
}
