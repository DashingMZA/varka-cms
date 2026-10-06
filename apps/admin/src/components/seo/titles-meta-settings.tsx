'use client';

import { useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';

function L(
  t: (ns: 'seo' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('seo', key);
  if (!v || v === key || v.startsWith('seo.')) return fallback;
  return v;
}

const VARIABLES = ['%title%', '%sitename%', '%sep%', '%term%', '%excerpt%', '%author%', '%date%'];

const DEFAULTS = {
  separator: '-',
  homepageTitle: '%sitename% %sep% %sitedesc%',
  homepageDescription: '',
  homepageRobots: 'index',
  postTitleTemplate: '%title% %sep% %sitename%',
  postDescTemplate: '%excerpt%',
  postRobots: 'index',
  pageTitleTemplate: '%title% %sep% %sitename%',
  pageDescTemplate: '%excerpt%',
  pageRobots: 'index',
  categoryTitleTemplate: '%term% %sep% %sitename%',
  categoryDescTemplate: '%term_description%',
  categoryRobots: 'index',
  tagTitleTemplate: '%term% %sep% %sitename%',
  tagDescTemplate: '%term_description%',
  tagRobots: 'index',
  authorArchives: true,
  authorTitleTemplate: '%author% %sep% %sitename%',
  authorRobots: 'index',
  noindexDateArchives: true,
  searchTitleTemplate: 'Search results for "%search_query%" %sep% %sitename%',
  noindexSearch: true,
  notFoundTitle: 'Page not found %sep% %sitename%',
};

type Settings = typeof DEFAULTS;

function TemplateField({
  label,
  value,
  onChange,
  t,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  t: (ns: 'seo' | 'common', key: string) => string;
  multiline?: boolean;
}) {
  return (
    <label className="v-seo-full" style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          style={{ width: '100%', fontSize: 14 }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', fontSize: 14 }}
        />
      )}
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
        {VARIABLES.map((v) => (
          <button
            key={v}
            type="button"
            className="v-btn v-btn--small"
            style={{ padding: '2px 8px', minHeight: 0, fontSize: 12, fontFamily: 'monospace' }}
            title={L(t, 'insertVariable', 'Insert variable')}
            onClick={() => onChange(value ? `${value} ${v}` : v)}
          >
            {v}
          </button>
        ))}
      </span>
    </label>
  );
}

function RobotsField({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  t: (ns: 'seo' | 'common', key: string) => string;
}) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', maxWidth: 320 }}>
        <option value="index">{L(t, 'robotsIndex', 'Index')}</option>
        <option value="noindex">{L(t, 'robotsNoindex', 'No Index')}</option>
      </select>
    </label>
  );
}

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

/** Rank Math-style Titles & Meta settings. */
export function TitlesMetaSettings() {
  const { t } = useMessages();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({ ...DEFAULTS });

  useEffect(() => {
    void (async () => {
      try {
        const result = await getSeoSettingsAction();
        if (result.ok && result.data) {
          setSettings((s) => ({ ...s, ...(result.data as Partial<Settings>) }));
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, []);

  const set = (key: keyof Settings, value: string | boolean) =>
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

  if (loading) return <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>;

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{L(t, 'titlesMeta', 'Titles & Meta')}</h1>
      </div>
      <p className="v-page-desc" style={{ marginTop: 0, maxWidth: 720 }}>
        {L(t, 'titlesMetaDesc', 'Control how your content appears in search results.')}
      </p>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      <Section
        title={L(t, 'globalSettings', 'Global Settings')}
        desc={L(t, 'globalSettingsDesc', 'Applies to every title generated by the SEO module.')}
      >
        <label style={{ display: 'block', minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            {L(t, 'titleSeparator', 'Title Separator')}
          </span>
          <select
            value={settings.separator}
            onChange={(e) => set('separator', e.target.value)}
            style={{ width: '100%', maxWidth: 320 }}
          >
            <option value="-">- (%sep%)</option>
            <option value="|">| (%sep%)</option>
            <option value=":">: (%sep%)</option>
            <option value="»">» (%sep%)</option>
            <option value="·">· (%sep%)</option>
          </select>
        </label>
        <div className="v-seo-full v-muted" style={{ fontSize: 13 }}>
          {L(t, 'variablesDesc', 'Available variables — click one under any field to insert it:')}{' '}
          <code>{VARIABLES.join('  ')}</code>
        </div>
      </Section>

      <Section
        title={L(t, 'homepage', 'Homepage')}
        desc={L(t, 'homepageDesc', 'Title and description for your site\u2019s front page.')}
      >
        <TemplateField label={L(t, 'homepageTitle', 'Homepage Title')} value={settings.homepageTitle} onChange={(v) => set('homepageTitle', v)} t={t} />
        <TemplateField label={L(t, 'homepageDescription', 'Homepage Description')} value={settings.homepageDescription} onChange={(v) => set('homepageDescription', v)} t={t} multiline />
        <RobotsField label={L(t, 'robotsLabel', 'Robots Meta')} value={settings.homepageRobots} onChange={(v) => set('homepageRobots', v)} t={t} />
      </Section>

      <Section
        title={L(t, 'posts', 'Posts')}
        desc={L(t, 'postsDesc', 'Default title & meta for single blog posts.')}
      >
        <TemplateField label={L(t, 'postTitleTemplate', 'Post Title Template')} value={settings.postTitleTemplate} onChange={(v) => set('postTitleTemplate', v)} t={t} />
        <TemplateField label={L(t, 'postDescTemplate', 'Post Description Template')} value={settings.postDescTemplate} onChange={(v) => set('postDescTemplate', v)} t={t} multiline />
        <RobotsField label={L(t, 'robotsLabel', 'Robots Meta')} value={settings.postRobots} onChange={(v) => set('postRobots', v)} t={t} />
      </Section>

      <Section
        title={L(t, 'pages', 'Pages')}
        desc={L(t, 'pagesDesc', 'Default title & meta for static pages.')}
      >
        <TemplateField label={L(t, 'pageTitleTemplate', 'Page Title Template')} value={settings.pageTitleTemplate} onChange={(v) => set('pageTitleTemplate', v)} t={t} />
        <TemplateField label={L(t, 'pageDescTemplate', 'Page Description Template')} value={settings.pageDescTemplate} onChange={(v) => set('pageDescTemplate', v)} t={t} multiline />
        <RobotsField label={L(t, 'robotsLabel', 'Robots Meta')} value={settings.pageRobots} onChange={(v) => set('pageRobots', v)} t={t} />
      </Section>

      <Section
        title={L(t, 'categories', 'Categories')}
        desc={L(t, 'categoriesDesc', 'Title & meta for category archive pages.')}
      >
        <TemplateField label={L(t, 'categoryTitleTemplate', 'Category Title Template')} value={settings.categoryTitleTemplate} onChange={(v) => set('categoryTitleTemplate', v)} t={t} />
        <TemplateField label={L(t, 'categoryDescTemplate', 'Category Description Template')} value={settings.categoryDescTemplate} onChange={(v) => set('categoryDescTemplate', v)} t={t} multiline />
        <RobotsField label={L(t, 'robotsLabel', 'Robots Meta')} value={settings.categoryRobots} onChange={(v) => set('categoryRobots', v)} t={t} />
      </Section>

      <Section
        title={L(t, 'tags', 'Tags')}
        desc={L(t, 'tagsDesc', 'Title & meta for tag archive pages.')}
      >
        <TemplateField label={L(t, 'tagTitleTemplate', 'Tag Title Template')} value={settings.tagTitleTemplate} onChange={(v) => set('tagTitleTemplate', v)} t={t} />
        <TemplateField label={L(t, 'tagDescTemplate', 'Tag Description Template')} value={settings.tagDescTemplate} onChange={(v) => set('tagDescTemplate', v)} t={t} multiline />
        <RobotsField label={L(t, 'robotsLabel', 'Robots Meta')} value={settings.tagRobots} onChange={(v) => set('tagRobots', v)} t={t} />
      </Section>

      <Section
        title={L(t, 'authors', 'Author Archives')}
        desc={L(t, 'authorsDesc', 'Archive pages listing posts by each author.')}
      >
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }} className="v-seo-full">
          <input
            type="checkbox"
            checked={settings.authorArchives}
            onChange={(e) => set('authorArchives', e.target.checked)}
          />
          {L(t, 'enableAuthorArchives', 'Enable author archives')}
        </label>
        <TemplateField label={L(t, 'authorTitleTemplate', 'Author Title Template')} value={settings.authorTitleTemplate} onChange={(v) => set('authorTitleTemplate', v)} t={t} />
        <RobotsField label={L(t, 'robotsLabel', 'Robots Meta')} value={settings.authorRobots} onChange={(v) => set('authorRobots', v)} t={t} />
      </Section>

      <Section
        title={L(t, 'miscPages', 'Misc Pages')}
        desc={L(t, 'miscPagesDesc', 'Date archives, search results and the 404 page.')}
      >
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={settings.noindexDateArchives}
            onChange={(e) => set('noindexDateArchives', e.target.checked)}
          />
          {L(t, 'noindexDateArchives', 'Noindex date archives')}
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={settings.noindexSearch}
            onChange={(e) => set('noindexSearch', e.target.checked)}
          />
          {L(t, 'noindexSearch', 'Noindex search result pages')}
        </label>
        <TemplateField label={L(t, 'searchTitleTemplate', 'Search Title Template')} value={settings.searchTitleTemplate} onChange={(v) => set('searchTitleTemplate', v)} t={t} />
        <TemplateField label={L(t, 'notFoundTitle', '404 Page Title')} value={settings.notFoundTitle} onChange={(v) => set('notFoundTitle', v)} t={t} />
      </Section>

      <div style={{ marginTop: 4 }}>
        <button type="button" className="v-btn v-btn--primary" onClick={() => void save()} disabled={saving}>
          {saving ? L(t, 'saving', 'Saving…') : L(t, 'saveChanges', 'Save Changes')}
        </button>
      </div>
    </div>
  );
}
