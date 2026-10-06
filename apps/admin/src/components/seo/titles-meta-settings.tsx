'use client';

import { useEffect, useState } from 'react';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';

/** Rank Math-style Titles & Meta settings. */
export function TitlesMetaSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    homepageTitle: '',
    homepageDescription: '',
    postTitleTemplate: '%title% %sep% %sitename%',
    pageTitleTemplate: '%title% %sep% %sitename%',
    categoryTitleTemplate: '%term% %sep% %sitename%',
    tagTitleTemplate: '%term% %sep% %sitename%',
    separator: '-',
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
    setMessage(null); setError(null);
    try {
      const result = await saveSeoSettingsAction(settings);
      if (result.ok) { setMessage('Settings saved.'); setError(null); } else { setError(result.error || 'Save failed'); setMessage(null); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed'); setMessage(null);
    }
    setSaving(false);
  }

  if (loading) return <p className="v-muted">Loading…</p>;

  const fields: Array<[string, string]> = [
    ['homepageTitle', 'Homepage Title'],
    ['homepageDescription', 'Homepage Description'],
    ['postTitleTemplate', 'Post Title Template'],
    ['pageTitleTemplate', 'Page Title Template'],
    ['categoryTitleTemplate', 'Category Title Template'],
    ['tagTitleTemplate', 'Tag Title Template'],
  ];

  return (
    <div className="v-card">
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}
      <p className="v-muted v-seo-full" style={{ marginTop: 0 }}>
        Use variables: %title%, %sitename%, %sep%, %term%, %excerpt%
      </p>
      <div className="v-seo-grid">
      {fields.map(([key, label]) => (
        <label key={key} style={{ display: 'block', marginBottom: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>{label}</span>
          <input
            value={(settings as Record<string, string>)[key] || ''}
            onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
            style={{ width: '100%' }}
          />
        </label>
      ))}
      <label style={{ display: 'block', marginBottom: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Title Separator</span>
        <select
          value={settings.separator}
          onChange={(e) => setSettings((s) => ({ ...s, separator: e.target.value }))}
        >
          <option value="-">-</option>
          <option value="|">|</option>
          <option value=":">:</option>
          <option value="»">»</option>
        </select>
      </label>
      </div>
      <div style={{ marginTop: 16 }}>
      <button type="button" className="v-btn v-btn--primary" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      </div>
    </div>
  );
}
