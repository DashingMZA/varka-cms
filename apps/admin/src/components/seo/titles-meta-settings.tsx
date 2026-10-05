'use client';

import { useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';

/** Rank Math-style Titles & Meta settings. */
export function TitlesMetaSettings() {
  const { t } = useMessages();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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

  const fields: Array<[string, string]> = [
    ['homepageTitle', 'Homepage Title'],
    ['homepageDescription', 'Homepage Description'],
    ['postTitleTemplate', 'Post Title Template'],
    ['pageTitleTemplate', 'Page Title Template'],
    ['categoryTitleTemplate', 'Category Title Template'],
    ['tagTitleTemplate', 'Tag Title Template'],
  ];

  return (
    <div className="v-card" style={{ maxWidth: 720 }}>
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}
      <p className="v-muted" style={{ marginTop: 0 }}>
        Use variables: %title%, %sitename%, %sep%, %term%, %excerpt%
      </p>
      {fields.map(([key, label]) => (
        <label key={key} style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>{label}</span>
          <input
            value={(settings as Record<string, string>)[key] || ''}
            onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
            style={{ width: '100%' }}
          />
        </label>
      ))}
      <label style={{ display: 'block', marginBottom: 12 }}>
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
      <button type="button" className="v-btn v-btn--primary" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}
