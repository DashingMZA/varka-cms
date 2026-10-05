'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'themes' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('themes', key);
  if (!v || v === key || v.startsWith('themes.')) return fallback;
  return v;
}

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
  const { t } = useMessages();
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [active, setActive] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/themes', { credentials: 'include' });
    if (!res.ok) {
      setError(L(t, 'loadFailed', `Load failed (${res.status})`).replace('{status}', String(res.status)));
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
      setError(
        body.error ?? L(t, 'activateFailed', `Activate failed (${res.status})`).replace('{status}', String(res.status)),
      );
      return;
    }
    setMessage(L(t, 'activatedTheme', `Activated ${themeId}`).replace('{themeId}', themeId));
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
        {L(t, 'themesRegistered', `${themes.length} themes registered (expect 10).`).replace(
          '{count}',
          String(themes.length),
        )}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {themes.map((th) => (
          <div
            key={th.id}
            style={{
              background: 'var(--card)',
              border: th.active ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            {th.tokens ? (
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[th.tokens.bg, th.tokens.card, th.tokens.accent, th.tokens.ink].map((c, i) => (
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
            <div style={{ fontWeight: 700 }}>{th.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{th.id}</div>
            <p style={{ fontSize: 13, margin: '8px 0' }}>{th.description}</p>
            {th.active ? (
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                {L(t, 'active', 'Active')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void activate(th.id)}
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
                {L(t, 'activate', 'Activate')}
              </button>
            )}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>
        {L(t, 'activeLabel', 'Active:')} <code>{active}</code>. {L(t, 'publicSiteLabel', 'Public site:')}{' '}
        <code>GET /api/public/theme</code> · {L(t, 'optionalEnvLabel', 'optional env')}{' '}
        <code>PUBLIC_THEME_ID</code>.
      </p>
    </div>
  );
}
