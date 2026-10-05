'use client';

import { useEffect, useState } from 'react';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';
import { TiptapEditor } from '@/components/tiptap-editor';
import { getPageAction, updatePageAction } from '@/actions/pages';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'pages' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('pages', key);
  if (!v || v === key || v.startsWith('pages.')) return fallback;
  return v;
}

type Translation = {
  languageId?: string;
  title: string;
  slug: string;
  contentHtml: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type Page = {
  id: string;
  status: string;
  translations: Translation[];
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

export function PageEditor({ pageId }: { pageId: string }) {
  const { t } = useMessages();
  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [languageId, setLanguageId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await getPageAction(pageId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const data = res.data as Page;
      setPage(data);
      setStatus(data.status);
      const tr = data.translations[0];
      if (tr) {
        setTitle(tr.title);
        setSlug(tr.slug);
        setContent(tr.contentHtml ?? '');
        setSeoTitle(tr.seoTitle ?? '');
        setSeoDescription(tr.seoDescription ?? '');
        setLanguageId(tr.languageId ?? '');
        setSlugTouched(Boolean(tr.slug && tr.slug !== 'untitled'));
      }
    })();
  }, [pageId]);

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function save(publish = false) {
    if (!page || !languageId) return;
    if (!title.trim()) {
      setError(L(t, 'titleRequired', 'Title is required'));
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await updatePageAction(pageId, {
      title,
      slug: slug || slugify(title),
      contentHtml: content,
      status: publish ? 'PUBLISHED' : status,
      languageId,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const data = res.data as Page;
    setPage(data);
    setStatus(data.status);
    setMessage(publish ? L(t, 'published', 'Published') : L(t, 'saved', 'Saved'));
  }

  if (!page && !error) return <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>;

  return (
    <div>
      <ScreenMeta
        help={[
          {
            id: 'page',
            title: L(t, 'editorHelpTitle', 'Page editor'),
            body: L(t, 'editorHelpBody', 'Edit page title, content, and SEO.'),
          },
        ]}
        options={[]}
      />
      <div className="v-page-header">
        <h1 className="v-page-title">{L(t, 'editPage', 'Edit Page')}</h1>
      </div>
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}
      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      <div className="v-editor">
        <div className="v-editor__main">
          <input
            className="v-editor__title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={L(t, 'addTitle', 'Add title')}
          />
          <p className="v-editor__slug">
            {L(t, 'slugLabel', 'Slug:')}{' '}
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </p>
          <TiptapEditor
            value={content}
            onChange={setContent}
            placeholder={L(t, 'writeContent', 'Write page content…')}
          />

          <div className="v-panel">
            <h3 className="v-panel__h">{L(t, 'seoPanel', 'SEO')}</h3>
            <div className="v-panel__b" style={{ display: 'grid', gap: 8 }}>
              <label>
                {L(t, 'seoTitleField', 'SEO title')}
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </label>
              <label>
                {L(t, 'seoDescriptionField', 'SEO description')}
                <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} />
              </label>
            </div>
          </div>
        </div>

        <aside className="v-editor__side">
          <div className="v-panel">
            <h3 className="v-panel__h">{L(t, 'publish', 'Publish')}</h3>
            <div className="v-panel__b">
              <p style={{ margin: '0 0 8px' }}>
                {L(t, 'status', 'Status')}:{' '}
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="DRAFT">{L(t, 'draft', 'Draft')}</option>
                  <option value="PUBLISHED">{L(t, 'published', 'Published')}</option>
                </select>
              </p>
              <div className="v-btn-row">
                <button type="button" className="v-btn" disabled={saving} onClick={() => void save(false)}>
                  {L(t, 'saveDraft', 'Save Draft')}
                </button>
                <button
                  type="button"
                  className="v-btn v-btn--primary"
                  disabled={saving}
                  onClick={() => void save(true)}
                >
                  {L(t, 'publish', 'Publish')}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
