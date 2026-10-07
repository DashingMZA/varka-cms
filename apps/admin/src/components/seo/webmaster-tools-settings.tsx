'use client';

import { useEffect, useState } from 'react';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';

/** Extract just the content value if user pastes a full meta tag. */
function extractToken(input: string): string {
  const m = input.match(/content=["']([^"']+)["']/i);
  return m?.[1]?.trim() ?? input.trim();
}

/** Webmaster Tools — ported from BMS-CMS. */
export function WebmasterToolsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    seo_verify_google: '',
    seo_verify_bing: '',
    seo_verify_yandex: '',
    seo_verify_pinterest: '',
  });

  useEffect(() => {
    void (async () => {
      try {
        const result = await getSeoSettingsAction();
        if (result.ok && result.data) {
          setSettings((s) => ({ ...s, ...(result.data as Record<string, string>) }));
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const set = (k: string, v: string) => setSettings((s) => ({ ...s, [k]: extractToken(v) }));

  async function save() {
    setSaving(true);
    setMessage(null); setError(null);
    try {
      const result = await saveSeoSettingsAction(settings);
      if (result.ok) { setMessage('Settings saved.'); } else { setError(result.error || 'Save failed'); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
    setSaving(false);
  }

  if (loading) return <p className="v-muted">Loading…</p>;

  const services = [
    ['seo_verify_google', 'Google Search Console', 'google-site-verification'],
    ['seo_verify_bing', 'Bing Webmaster Tools', 'msvalidate.01'],
    ['seo_verify_yandex', 'Yandex Webmaster', 'yandex-verification'],
    ['seo_verify_pinterest', 'Pinterest', 'p:domain_verify'],
  ] as const;

  return (
    <div>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      <div className="v-card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Site Verification</h2>
        <p className="v-muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
          Each service gives you a meta tag like <code>&lt;meta name="google-site-verification" content="abc123"&gt;</code>.
          Paste only the <strong>content</strong> value (or the full tag — we'll extract it).
        </p>
        {services.map(([k, label, tag]) => (
          <div key={k} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{label}</label>
            <input
              style={{ width: '100%', maxWidth: 500, fontFamily: 'monospace', fontSize: 12 }}
              value={settings[k] || ''}
              onChange={(e) => set(k, e.target.value)}
              placeholder={`content value of <meta name="${tag}">`}
              spellCheck={false}
            />
          </div>
        ))}
      </div>

      <button type="button" className="v-btn v-btn--primary" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}
