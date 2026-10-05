'use client';

import { Field, SettingsForm, inputStyle } from '@/components/settings/settings-form';

const DEFAULTS = {
  homepageDisplays: 'posts',
  homepagePageId: '',
  postsPageId: '',
  postsPerPage: 10,
  feedItems: 10,
  feedFullText: true,
  discourageSearchEngines: false,
};

export default function ReadingSettingsPage() {
  return (
    <SettingsForm
      group="reading"
      title="Reading Settings"
      description="Homepage, blog pages, feeds, and search engine visibility."
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field label="Your homepage displays">
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input
                type="radio"
                checked={v.homepageDisplays === 'posts'}
                onChange={() => set('homepageDisplays', 'posts')}
              />
              Your latest posts
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="radio"
                checked={v.homepageDisplays === 'page'}
                onChange={() => set('homepageDisplays', 'page')}
              />
              A static page
            </label>
          </Field>
          {v.homepageDisplays === 'page' ? (
            <>
              <Field label="Homepage (page id or slug)">
                <input
                  style={inputStyle}
                  value={String(v.homepagePageId ?? '')}
                  onChange={(e) => set('homepagePageId', e.target.value)}
                />
              </Field>
              <Field label="Posts page (page id or slug)">
                <input
                  style={inputStyle}
                  value={String(v.postsPageId ?? '')}
                  onChange={(e) => set('postsPageId', e.target.value)}
                />
              </Field>
            </>
          ) : null}
          <Field label="Number of recent posts shown on archive pages">
            <input
              type="number"
              min={1}
              max={100}
              style={{ ...inputStyle, maxWidth: 100 }}
              value={Number(v.postsPerPage ?? 10)}
              onChange={(e) => set('postsPerPage', Number(e.target.value))}
            />
          </Field>
          <Field label="Number of recent items shown in syndication feeds">
            <input
              type="number"
              min={1}
              max={100}
              style={{ ...inputStyle, maxWidth: 100 }}
              value={Number(v.feedItems ?? 10)}
              onChange={(e) => set('feedItems', Number(e.target.value))}
            />
          </Field>
          <Field label="For each post in a feed, include">
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input
                type="radio"
                checked={v.feedFullText === true}
                onChange={() => set('feedFullText', true)}
              />
              Full text
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="radio"
                checked={v.feedFullText === false}
                onChange={() => set('feedFullText', false)}
              />
              Excerpt
            </label>
          </Field>
          <Field label="Search engine visibility">
            <label style={{ display: 'flex', gap: 8, fontSize: 14, alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={Boolean(v.discourageSearchEngines)}
                onChange={(e) => set('discourageSearchEngines', e.target.checked)}
              />
              <span>
                Discourage search engines from indexing this site
                <br />
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                  It is up to search engines to honor this request.
                </span>
              </span>
            </label>
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
