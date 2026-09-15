'use client';

import { useCallback, useEffect, useState } from 'react';

type ThemeRow = {
  id: string;
  name: string;
  description?: string;
  active: boolean;
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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
        Active: <code>{active}</code>. Public site reads theme via{' '}
        <code>PUBLIC_THEME_ID</code> / SiteSetting <code>theme.active</code>.
      </p>
    </div>
  );
}
