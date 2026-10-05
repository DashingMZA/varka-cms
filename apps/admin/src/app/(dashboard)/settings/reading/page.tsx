'use client';

import { useEffect, useState } from 'react';
import { Field, SettingsForm, inputStyle } from '@/components/settings/settings-form';
import { listPagesAction } from '@/actions/pages';
import { useMessages } from '@/lib/i18n';

function L(t: (ns: 'settings' | 'common', key: string) => string, key: string, fallback: string): string {
  const v = t('settings', key);
  if (!v || v === key || v.startsWith('settings.')) return fallback;
  return v;
}

const DEFAULTS = {
  homepageDisplays: 'posts',
  homepagePageId: '',
  postsPageId: '',
  postsPerPage: 10,
  feedItems: 10,
  feedFullText: true,
  discourageSearchEngines: false,
};

type PageOption = { id: string; title: string };

export default function ReadingSettingsPage() {
  const { t } = useMessages();
  const [pages, setPages] = useState<PageOption[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPagesAction({ limit: 100 });
        if (res.ok) {
          const data = res.data as { items?: Array<{ id: string; title: string }> };
          setPages((data.items ?? []).map((p) => ({ id: p.id, title: p.title })));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);
  return (
    <SettingsForm
      group="reading"
      title={L(t, 'readingTitle', 'Reading Settings')}
      description={L(t, 'readingDesc', 'Homepage, blog pages, feeds, and search engine visibility.')}
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field label={L(t, 'homepageDisplays', 'Your homepage displays')}>
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input
                type="radio"
                checked={v.homepageDisplays === 'posts'}
                onChange={() => set('homepageDisplays', 'posts')}
              />
              {L(t, 'latestPosts', 'Your latest posts')}
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="radio"
                checked={v.homepageDisplays === 'page'}
                onChange={() => set('homepageDisplays', 'page')}
              />
              {L(t, 'staticPage', 'A static page')}
            </label>
          </Field>
          {v.homepageDisplays === 'page' ? (
            <>
              <Field label={L(t, 'homepagePage', 'Homepage')}>
                <select
                  style={inputStyle}
                  value={String(v.homepagePageId ?? '')}
                  onChange={(e) => set('homepagePageId', e.target.value)}
                >
                  <option value="">{L(t, 'selectPage', '— Select —')}</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={L(t, 'postsPage', 'Posts page')}>
                <select
                  style={inputStyle}
                  value={String(v.postsPageId ?? '')}
                  onChange={(e) => set('postsPageId', e.target.value)}
                >
                  <option value="">{L(t, 'selectPage', '— Select —')}</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}
          <Field label={L(t, 'postsPerPage', 'Number of recent posts shown on archive pages')}>
            <input
              type="number"
              min={1}
              max={100}
              style={{ ...inputStyle, maxWidth: 100 }}
              value={Number(v.postsPerPage ?? 10)}
              onChange={(e) => set('postsPerPage', Number(e.target.value))}
            />
          </Field>
          <Field label={L(t, 'feedItems', 'Number of recent items shown in syndication feeds')}>
            <input
              type="number"
              min={1}
              max={100}
              style={{ ...inputStyle, maxWidth: 100 }}
              value={Number(v.feedItems ?? 10)}
              onChange={(e) => set('feedItems', Number(e.target.value))}
            />
          </Field>
          <Field label={L(t, 'feedInclude', 'For each post in a feed, include')}>
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input
                type="radio"
                checked={v.feedFullText === true}
                onChange={() => set('feedFullText', true)}
              />
              {L(t, 'fullText', 'Full text')}
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="radio"
                checked={v.feedFullText === false}
                onChange={() => set('feedFullText', false)}
              />
              {L(t, 'excerpt', 'Excerpt')}
            </label>
          </Field>
          <Field label={L(t, 'searchVisibility', 'Search engine visibility')}>
            <label style={{ display: 'flex', gap: 8, fontSize: 14, alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={Boolean(v.discourageSearchEngines)}
                onChange={(e) => set('discourageSearchEngines', e.target.checked)}
              />
              <span>
                {L(t, 'discourageSearch', 'Discourage search engines from indexing this site')}
                <br />
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {L(t, 'discourageHint', 'It is up to search engines to honor this request.')}
                </span>
              </span>
            </label>
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
