'use client';

import { useCallback, useEffect, useState } from 'react';

type Lang = {
  id: string;
  name: string;
  nativeName: string;
  locale: string;
  languageCode: string;
  script: string;
  direction: string;
  urlPrefix: string;
  enabled: boolean;
  defaultLanguage: boolean;
};

export function LanguagesAdmin() {
  const [items, setItems] = useState<Lang[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/languages', { credentials: 'include' });
    if (!res.ok) {
      setError(`Load failed (${res.status})`);
      return;
    }
    const data = (await res.json()) as { items: Lang[] };
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleEnabled(lang: Lang) {
    setError(null);
    const res = await fetch(`/api/languages/${lang.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ enabled: !lang.enabled }),
    });
    if (!res.ok) {
      setError(`Update failed (${res.status})`);
      return;
    }
    setMessage(`${lang.locale} ${!lang.enabled ? 'enabled' : 'disabled'}`);
    await load();
  }

  async function addPunjabi() {
    setError(null);
    setMessage(null);
    const res = await fetch('/api/languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: 'Punjabi',
        nativeName: 'پنجابی',
        locale: 'pa',
        languageCode: 'pa',
        script: 'Arab',
        direction: 'rtl',
        urlPrefix: 'pa',
        enabled: true,
        defaultLanguage: false,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? `Create failed (${res.status})`);
      return;
    }
    setMessage('Punjabi (pa) added — one language row + script field');
    await load();
  }

  const hasPa = items.some((l) => l.locale === 'pa' || l.languageCode === 'pa');

  return (
    <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, maxWidth: 560 }}>
        Default language is prefixless. Other languages use <code>urlPrefix</code> (e.g.{' '}
        <code>/pa/post/slug</code>). Punjabi is one language; script is a field, not a second row.
      </p>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      {message ? <p style={{ color: '#15803d', margin: 0 }}>{message}</p> : null}
      {!hasPa ? (
        <button type="button" onClick={() => void addPunjabi()} style={btn}>
          Add Punjabi (pa · Arab script)
        </button>
      ) : null}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: 10 }}>Name</th>
            <th style={{ padding: 10 }}>Locale</th>
            <th style={{ padding: 10 }}>Script</th>
            <th style={{ padding: 10 }}>Prefix</th>
            <th style={{ padding: 10 }}>Default</th>
            <th style={{ padding: 10 }}>Enabled</th>
            <th style={{ padding: 10 }} />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 16, color: 'var(--muted)' }}>
                No languages — run seed.
              </td>
            </tr>
          ) : (
            items.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 10 }}>
                  {l.name} <span style={{ color: 'var(--muted)' }}>({l.nativeName})</span>
                </td>
                <td style={{ padding: 10, fontFamily: 'monospace', fontSize: 13 }}>{l.locale}</td>
                <td style={{ padding: 10 }}>{l.script}</td>
                <td style={{ padding: 10, fontFamily: 'monospace', fontSize: 13 }}>
                  {l.urlPrefix || '—'}
                </td>
                <td style={{ padding: 10 }}>{l.defaultLanguage ? 'yes' : ''}</td>
                <td style={{ padding: 10 }}>{l.enabled ? 'yes' : 'no'}</td>
                <td style={{ padding: 10 }}>
                  <button type="button" style={btnMuted} onClick={() => void toggleEnabled(l)}>
                    {l.enabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const btn: Record<string, string | number> = {
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
  width: 'fit-content',
};
const btnMuted: Record<string, string | number> = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: '#fff',
  fontSize: 12,
};
