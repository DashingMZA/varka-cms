'use client';

import { useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';

/** Rank Math-style Sitemap settings. */
export function SitemapSettings() {
  const { t } = useMessages();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    sitemapEnabled: true,
    includePosts: true,
    includePages: true,
    includeCategories: true,
    includeTags: false,
    linksPerSitemap: 1000,
  });

  useEffect(() => {
    void (async () => {
      try {
        const result = await getSeoSettingsAction();
        if (result.ok && result.data) {
          setSettings((s) => ({ ...s, ...(result.data as object) }));
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveSeoSettingsAction(settings);
      setMessage(result.ok ? 'Settings saved.' : `Error: ${result.error}`);
    } catch (e) {
      setMessage(`Error: ${e instanceof Error ? e.message : 'Save failed'}`);
    }
    setSaving(false);
  }

  if (loading) return <p className="v-muted">Loading…</p>;

  const toggles: Array<[string, string]> = [
    ['sitemapEnabled', 'Enable Sitemap'],
    ['includePosts', 'Include Posts'],
    ['includePages', 'Include Pages'],
    ['includeCategories', 'Include Categories'],
    ['includeTags', 'Include Tags'],
  ];

  return (
    <div className="v-card" style={{ maxWidth: 720 }}>
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}
      {toggles.map(([key, label]) => (
        <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={Boolean((settings as Record<string, unknown>)[key])}
            onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
          />
          {label}
        </label>
      ))}
      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Links Per Sitemap</span>
        <input
          type="number"
          value={settings.linksPerSitemap}
          onChange={(e) => setSettings((s) => ({ ...s, linksPerSitemap: Number(e.target.value) }))}
          min={1}
          max={50000}
        />
      </label>
      <button type="button" className="v-btn v-btn--primary" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}
