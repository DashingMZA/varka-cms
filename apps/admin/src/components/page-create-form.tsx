'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { slugify } from '@/lib/slugify';
import { TiptapEditor } from '@/components/tiptap-editor';
import { useMessages } from '@/lib/i18n';
import { createPageAction } from '@/actions/pages';

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

export function PageCreateForm() {
  const { t } = useMessages();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [contentHtml, setContentHtml] = useState('');
  const [template, setTemplate] = useState('default');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function create(publish: boolean) {
    if (!title.trim()) {
      setError(L(t, 'enterTitle', 'Please enter a title'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await createPageAction(title.trim(), {
        slug: slug.trim() || undefined,
        contentHtml,
        template,
        status: publish ? 'PUBLISHED' : 'DRAFT',
      });
      if (!result.ok) {
        setError(
          result.error ??
            L(t, 'createFailed', 'Create failed'),
        );
        setBusy(false);
        return;
      }
      router.push(`/content/pages/${result.data.id}`);
    } catch {
      setError(L(t, 'networkError', 'Network error'));
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{L(t, 'newPage', 'Add New Page')}</h1>
        <Link href="/content/pages" className="v-btn">
          ← {L(t, 'allPages', 'All Pages')}
        </Link>
      </div>
      {error ? <div className="v-alert v-alert--error">{error}</div> : null}
      <div className="v-editor">
        <div>
          <input
            className="v-editor__title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={L(t, 'addTitle', 'Add title')}
            autoFocus
          />
          <div className="v-editor__slug">
            <span>{L(t, 'permalink', 'Permalink:')}</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder={L(t, 'autoFromTitle', 'auto-from-title')}
            />
          </div>
          <label className="v-muted" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
            {L(t, 'content', 'Content')}
          </label>
          <TiptapEditor value={contentHtml} onChange={setContentHtml} />
        </div>
        <aside className="v-editor__meta">
          <section className="v-panel" style={{ marginTop: 0 }}>
            <h2 className="v-panel__h">{L(t, 'publish', 'Publish')}</h2>
            <div className="v-panel__b">
              <p className="v-muted" style={{ marginTop: 0 }}>
                {L(t, 'notSavedNote', 'Not saved until you click Save Draft or Publish.')}
              </p>
              <div className="v-btn-row">
                <button
                  type="button"
                  className="v-btn v-btn--primary"
                  disabled={busy || !title.trim()}
                  onClick={() => void create(false)}
                >
                  {busy ? L(t, 'saving', 'Saving…') : L(t, 'saveDraft', 'Save Draft')}
                </button>
                <button
                  type="button"
                  className="v-btn v-btn--success"
                  disabled={busy || !title.trim()}
                  onClick={() => void create(true)}
                >
                  {L(t, 'publish', 'Publish')}
                </button>
              </div>
            </div>
          </section>
          <section className="v-panel">
            <h2 className="v-panel__h">{L(t, 'pageAttributes', 'Page attributes')}</h2>
            <div className="v-panel__b">
              <label>
                {L(t, 'template', 'Template')}
                <select value={template} onChange={(e) => setTemplate(e.target.value)}>
                  <option value="default">{L(t, 'templateDefault', 'Default')}</option>
                  <option value="full-width">{L(t, 'templateFullWidth', 'Full width')}</option>
                  <option value="landing">{L(t, 'templateLanding', 'Landing')}</option>
                </select>
              </label>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
