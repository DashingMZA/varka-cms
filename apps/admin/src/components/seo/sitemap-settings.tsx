'use client';

import { useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';
import { getSettingsAction } from '@/actions/settings';

function L(
  t: (ns: 'seo' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('seo', key);
  if (!v || v === key || v.startsWith('seo.')) return fallback;
  return v;
}

const DEFAULTS = {
  sitemapEnabled: true,
  includePosts: true,
  includePages: true,
  includeCategories: true,
  includeTags: false,
  includeImages: true,
  linksPerSitemap: 1000,
  excludePosts: '',
  excludeTerms: '',
};

type Settings = typeof DEFAULTS;

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="v-card" style={{ marginBottom: 16 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>{title}</h2>
      {desc ? <p className="v-muted" style={{ margin: '0 0 12px', fontSize: 13 }}>{desc}</p> : null}
      <div className="v-seo-grid">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: 'block', fontSize: 14, minWidth: 0 }} className="v-seo-full">
      <span style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          <span style={{ fontWeight: 600 }}>{label}</span>
          {desc ? <span className="v-muted" style={{ display: 'block', fontWeight: 400, fontSize: 13, marginTop: 2 }}>{desc}</span> : null}
        </span>
      </span>
    </label>
  );
}

/** Rank Math-style Sitemap settings. */
export function SitemapSettings() {
  const { t } = useMessages();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [settings, setSettings] = useState<Settings>({ ...DEFAULTS });

  useEffect(() => {
    void (async () => {
      try {
        const [seo, general] = await Promise.all([getSeoSettingsAction(), getSettingsAction('general')]);
        if (seo.ok && seo.data) setSettings((s) => ({ ...s, ...(seo.data as Partial<Settings>) }));
        if (general.ok) {
          const g = (general.data as { settings?: Record<string, unknown> })?.settings;
          const url = String(g?.siteUrl ?? g?.siteurl ?? '').replace(/\/$/, '');
          if (url) setSiteUrl(url);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, []);

  const set = (key: keyof Settings, value: string | boolean | number) =>
    setSettings((s) => ({ ...s, [key]: value }));

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await saveSeoSettingsAction(settings as unknown as Record<string, unknown>);
      if (result.ok) setMessage(L(t, 'saved', 'Settings saved.'));
      else setError(result.error || L(t, 'saveFailed', 'Save failed'));
    } catch (e) {
      setError(e instanceof Error ? e.message : L(t, 'saveFailed', 'Save failed'));
    }
    setSaving(false);
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (loading) return <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>;

  const sitemapUrl = siteUrl ? `${siteUrl}/sitemap.xml` : '/sitemap.xml';

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{L(t, 'sitemapSettings', 'Sitemap Settings')}</h1>
      </div>
      <p className="v-page-desc" style={{ marginTop: 0, maxWidth: 720 }}>
        {L(t, 'sitemapSettingsDesc', 'Configure the XML sitemap for search engines.')}
      </p>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      <Section
        title={L(t, 'general', 'General')}
        desc={L(t, 'sitemapDesc', 'Help search engines discover every page on your site.')}
      >
        <Toggle
          label={L(t, 'enableSitemap', 'Enable sitemap')}
          desc={L(t, 'enableSitemapDesc', 'Generate an XML sitemap index for posts, pages and taxonomies.')}
          checked={settings.sitemapEnabled}
          onChange={(v) => set('sitemapEnabled', v)}
        />
        {settings.sitemapEnabled ? (
          <div className="v-seo-full">
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
              {L(t, 'sitemapUrl', 'Your sitemap')}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <code style={{ fontSize: 13, padding: '8px 12px', background: '#f3f4f6', borderRadius: 6, overflowWrap: 'anywhere' }}>
                {sitemapUrl}
              </code>
              <button type="button" className="v-btn v-btn--small" onClick={() => void copyUrl(sitemapUrl)}>
                {copied ? L(t, 'copied', 'Copied!') : L(t, 'copy', 'Copy')}
              </button>
              <a className="v-btn v-btn--small" href={sitemapUrl} target="_blank" rel="noreferrer">
                {L(t, 'viewSitemap', 'View')}
              </a>
            </div>
          </div>
        ) : null}
        <label style={{ display: 'block', minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            {L(t, 'linksPerSitemap', 'Links per sitemap')}
          </span>
          <input
            type="number"
            min={1}
            max={50000}
            value={settings.linksPerSitemap}
            onChange={(e) => set('linksPerSitemap', Number(e.target.value))}
            style={{ width: '100%', maxWidth: 200 }}
          />
        </label>
        <Toggle
          label={L(t, 'includeImages', 'Include images')}
          desc={L(t, 'includeImagesDesc', 'Add image URLs to the sitemap so they can appear in image search.')}
          checked={settings.includeImages}
          onChange={(v) => set('includeImages', v)}
        />
      </Section>

      <Section title={L(t, 'postTypes', 'Post Types')}>
        <Toggle label={L(t, 'includePosts', 'Include posts')} checked={settings.includePosts} onChange={(v) => set('includePosts', v)} />
        <Toggle label={L(t, 'includePages', 'Include pages')} checked={settings.includePages} onChange={(v) => set('includePages', v)} />
        <label className="v-seo-full" style={{ display: 'block', minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            {L(t, 'excludePosts', 'Exclude posts / pages')}
          </span>
          <input
            value={settings.excludePosts}
            onChange={(e) => set('excludePosts', e.target.value)}
            placeholder="12, 34, 56"
            style={{ width: '100%' }}
          />
          <span className="v-muted" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
            {L(t, 'excludePostsDesc', 'Comma-separated post or page IDs to leave out of the sitemap.')}
          </span>
        </label>
      </Section>

      <Section title={L(t, 'taxonomies', 'Taxonomies')}>
        <Toggle label={L(t, 'includeCategories', 'Include categories')} checked={settings.includeCategories} onChange={(v) => set('includeCategories', v)} />
        <Toggle label={L(t, 'includeTags', 'Include tags')} checked={settings.includeTags} onChange={(v) => set('includeTags', v)} />
        <label className="v-seo-full" style={{ display: 'block', minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            {L(t, 'excludeTerms', 'Exclude terms')}
          </span>
          <input
            value={settings.excludeTerms}
            onChange={(e) => set('excludeTerms', e.target.value)}
            placeholder="7, 19"
            style={{ width: '100%' }}
          />
          <span className="v-muted" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
            {L(t, 'excludeTermsDesc', 'Comma-separated category or tag IDs to leave out of the sitemap.')}
          </span>
        </label>
      </Section>

      <div style={{ marginTop: 4 }}>
        <button type="button" className="v-btn v-btn--primary" onClick={() => void save()} disabled={saving}>
          {saving ? L(t, 'saving', 'Saving…') : L(t, 'saveChanges', 'Save Changes')}
        </button>
      </div>
    </div>
  );
}
