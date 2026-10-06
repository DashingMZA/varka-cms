'use client';

import { useEffect, useState } from 'react';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';
import { renderTemplate, SEO_VARIABLES } from '@varka/seo';

/** Rank Math-style Titles & Meta settings with live template previews. */
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
  const [activeField, setActiveField] = useState<string | null>(null);

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

  /** Insert a variable at cursor position in the active field */
  function insertVariable(token: string) {
    if (!activeField) return;
    setSettings((s) => ({
      ...s,
      [activeField]: ((s as Record<string, string>)[activeField] || '') + token,
    }));
  }

  /** Live preview using BMS template engine */
  function preview(template: string, sampleVars: Record<string, string>): string {
    return renderTemplate(template, {
      sitename: 'My Site',
      sitedesc: 'A CMS made for bloggers',
      ...sampleVars,
    }, settings.separator || '-');
  }

  if (loading) return <p className="v-muted">Loading…</p>;

  const fields: Array<{ key: string; label: string; sample: Record<string, string> }> = [
    { key: 'homepageTitle', label: 'Homepage Title', sample: {} },
    { key: 'homepageDescription', label: 'Homepage Description', sample: {} },
    { key: 'postTitleTemplate', label: 'Post Title Template', sample: { title: 'How to fix lag issues' } },
    { key: 'pageTitleTemplate', label: 'Page Title Template', sample: { title: 'About Us' } },
    { key: 'categoryTitleTemplate', label: 'Category Title Template', sample: { term: 'Technology' } },
    { key: 'tagTitleTemplate', label: 'Tag Title Template', sample: { term: 'Tutorial' } },
  ];

  return (
    <div className="v-card">
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      {/* Clickable variable buttons from BMS SEO_VARIABLES */}
      <div style={{ marginBottom: 16 }}>
        <p className="v-muted" style={{ margin: '0 0 8px', fontSize: 13 }}>
          Click a variable to insert it into the focused field:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SEO_VARIABLES.map((v) => (
            <button
              key={v.token}
              type="button"
              className="v-btn v-btn--small"
              onClick={() => insertVariable(v.token)}
              title={`${v.label} (${v.scope})`}
              disabled={!activeField}
            >
              {v.token}
            </button>
          ))}
        </div>
      </div>

      <div className="v-seo-grid">
      {fields.map(({ key, label, sample }) => {
        const value = (settings as Record<string, string>)[key] || '';
        const previewText = preview(value, sample);
        return (
          <label key={key} style={{ display: 'block', marginBottom: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>{label}</span>
            <input
              value={value}
              onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
              onFocus={() => setActiveField(key)}
              style={{ width: '100%' }}
            />
            {previewText ? (
              <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Preview: {previewText}
              </span>
            ) : null}
          </label>
        );
      })}
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
