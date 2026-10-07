'use client';

import { useEffect, useState } from 'react';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';

/** Social & Schema settings — ported from BMS-CMS. */
export function SocialSchemaSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    seo_kg_type: 'organization',
    seo_kg_name: '',
    seo_kg_logo: '',
    seo_og_default_image: '',
    seo_twitter_card: 'summary_large_image',
    seo_twitter_site: '',
    seo_fb_page: '',
    social_facebook: '',
    social_twitter: '',
    social_instagram: '',
    social_linkedin: '',
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

  const set = (k: string, v: string) => setSettings((s) => ({ ...s, [k]: v }));

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

  const inputStyle = { width: '100%', maxWidth: 480 } as const;

  return (
    <div>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      <div className="v-card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Knowledge Graph</h2>
        <p className="v-muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
          Tells search engines who publishes this site. Output as Organization or Person schema on every page.
        </p>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>This site represents</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['organization', 'An organisation'], ['person', 'A person']].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => set('seo_kg_type', v || 'organization')}
                className={`v-btn ${settings.seo_kg_type === v ? 'v-btn--primary' : ''}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Name</label>
          <input
            style={inputStyle}
            value={settings.seo_kg_name || ''}
            onChange={(e) => set('seo_kg_name', e.target.value)}
            placeholder="Defaults to your site name"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Logo</label>
          <input
            style={inputStyle}
            value={settings.seo_kg_logo || ''}
            onChange={(e) => set('seo_kg_logo', e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          <p className="v-muted" style={{ fontSize: 12, margin: '4px 0 0' }}>Square works best. Used in the publisher schema.</p>
        </div>
      </div>

      <div className="v-card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: '0 0 16px' }}>Sharing Defaults</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Default share image</label>
          <input
            style={inputStyle}
            value={settings.seo_og_default_image || ''}
            onChange={(e) => set('seo_og_default_image', e.target.value)}
            placeholder="https://example.com/og-image.jpg"
          />
          <p className="v-muted" style={{ fontSize: 12, margin: '4px 0 0' }}>Used when a post has no OG image. 1200×630 is the safe size.</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Twitter card type</label>
          <select
            value={settings.seo_twitter_card || 'summary_large_image'}
            onChange={(e) => set('seo_twitter_card', e.target.value)}
            style={{ maxWidth: 200 }}
          >
            <option value="summary_large_image">Large image</option>
            <option value="summary">Summary</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>X / Twitter handle</label>
          <input
            style={{ ...inputStyle, maxWidth: 300 }}
            value={settings.seo_twitter_site || ''}
            onChange={(e) => set('seo_twitter_site', e.target.value)}
            placeholder="@yoursite"
          />
          <p className="v-muted" style={{ fontSize: 12, margin: '4px 0 0' }}>Emitted as <code>twitter:site</code>.</p>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Facebook page URL</label>
          <input
            style={inputStyle}
            value={settings.seo_fb_page || ''}
            onChange={(e) => set('seo_fb_page', e.target.value)}
            placeholder="https://www.facebook.com/yourpage"
          />
          <p className="v-muted" style={{ fontSize: 12, margin: '4px 0 0' }}>Emitted as <code>article:publisher</code> on posts.</p>
        </div>
      </div>

      <div className="v-card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Social Profiles</h2>
        <p className="v-muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
          Linked into the Organization/Person schema as <code>sameAs</code>.
        </p>
        {([
          ['social_facebook', 'Facebook', 'https://facebook.com/yourpage'],
          ['social_twitter', 'X / Twitter', 'https://x.com/yourhandle'],
          ['social_instagram', 'Instagram', 'https://instagram.com/yourhandle'],
          ['social_linkedin', 'LinkedIn', 'https://linkedin.com/company/yourpage'],
        ] as const).map(([k, label, placeholder]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{label}</label>
            <input
              style={inputStyle}
              value={settings[k] || ''}
              onChange={(e) => set(k, e.target.value)}
              placeholder={placeholder}
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
