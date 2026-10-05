'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
  version?: string;
  author?: string;
  screenshot?: string;
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

/** WordPress-style theme grid: screenshot cards with hover actions. */
export function ThemePicker() {
  const { t } = useMessages();
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [active, setActive] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

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
    setBusy(themeId);
    const res = await fetch('/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ themeId }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? `Activate failed (${res.status})`);
      return;
    }
    setMessage(L(t, 'activatedTheme', 'Theme activated.').replace('{themeId}', themeId));
    await load();
  }

  const filtered = themes.filter((th) => {
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return (
      th.name.toLowerCase().includes(needle) ||
      th.id.toLowerCase().includes(needle) ||
      (th.description ?? '').toLowerCase().includes(needle)
    );
  });

  // Active theme first
  const sorted = [...filtered].sort((a, b) => (a.active ? -1 : b.active ? 1 : 0));

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{L(t, 'themes', 'Themes')}</h1>
        <span className="v-muted" style={{ fontSize: 13 }}>
          {L(t, 'themesCount', '{count} themes').replace('{count}', String(themes.length))}
        </span>
      </div>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      <div className="v-list-table-top">
        <div />
        <div className="v-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L(t, 'searchThemes', 'Search themes…')}
          />
          <button type="button" className="v-btn" onClick={() => {}}>
            {L(t, 'search', 'Search')}
          </button>
        </div>
      </div>

      <div className="v-theme-grid">
        {sorted.map((th) => (
          <div
            key={th.id}
            className={`v-theme-card${th.active ? ' v-theme-card--active' : ''}`}
          >
            <div className="v-theme-card__screenshot">
              {th.screenshot ? (
                <img src={th.screenshot} alt={th.name} loading="lazy" />
              ) : th.tokens ? (
                <div
                  className="v-theme-card__preview"
                  style={{
                    background: th.tokens.bg,
                    color: th.tokens.ink,
                  }}
                >
                  <div
                    style={{
                      background: th.tokens.card,
                      border: `1px solid ${th.tokens.border}`,
                      borderRadius: 8,
                      padding: 12,
                      margin: 16,
                    }}
                  >
                    <div
                      style={{
                        height: 12,
                        width: '60%',
                        background: th.tokens.accent,
                        borderRadius: 4,
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        height: 8,
                        width: '90%',
                        background: th.tokens.muted,
                        borderRadius: 4,
                        marginBottom: 6,
                      }}
                    />
                    <div
                      style={{
                        height: 8,
                        width: '75%',
                        background: th.tokens.muted,
                        borderRadius: 4,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', paddingBottom: 12 }}>
                    {[th.tokens.bg, th.tokens.card, th.tokens.accent, th.tokens.ink].map((c, i) => (
                      <span
                        key={i}
                        title={c}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          background: c,
                          border: '1px solid rgba(0,0,0,0.1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="v-theme-card__preview v-theme-card__preview--empty">
                  <span className="v-muted">{L(t, 'noScreenshot', 'No screenshot')}</span>
                </div>
              )}
              {th.active ? (
                <span className="v-theme-card__badge">{L(t, 'active', 'Active')}</span>
              ) : null}
              <div className="v-theme-card__actions">
                {!th.active ? (
                  <button
                    type="button"
                    className="v-btn v-btn--primary"
                    disabled={busy === th.id}
                    onClick={() => void activate(th.id)}
                  >
                    {busy === th.id ? '…' : L(t, 'activate', 'Activate')}
                  </button>
                ) : (
                  <Link href="/appearance/customize" className="v-btn">
                    {L(t, 'customize', 'Customize')}
                  </Link>
                )}
              </div>
            </div>
            <div className="v-theme-card__meta">
              <h3 className="v-theme-card__name">{th.name}</h3>
              {th.description ? (
                <p className="v-muted" style={{ fontSize: 12, margin: '4px 0 0' }}>
                  {th.description}
                </p>
              ) : null}
              <div className="v-muted" style={{ fontSize: 11, marginTop: 4 }}>
                {th.version ? `v${th.version}` : ''}
                {th.author ? ` ${L(t, 'by', 'by')} ${th.author}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && !error ? (
        <p className="v-muted">{L(t, 'noThemes', 'No themes found.')}</p>
      ) : null}
    </div>
  );
}
