'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { slugify } from '@/lib/slugify';
import { TiptapEditor } from '@/components/tiptap-editor';

type Translation = {
  id: string;
  languageId: string;
  title: string;
  slug: string;
  contentHtml: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type Page = {
  id: string;
  status: string;
  version: number;
  template?: string;
  updatedAt?: string;
  translations: Translation[];
};

export function PageEditor({ pageId }: { pageId: string }) {
  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(true);
  const [contentHtml, setContentHtml] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [template, setTemplate] = useState('default');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/pages/${pageId}`, { credentials: 'include' });
      if (!res.ok) {
        setError(`Load failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as Page;
      setPage(data);
      const tr = data.translations[0];
      if (tr) {
        setTitle(tr.title);
        setSlug(tr.slug);
        setContentHtml(tr.contentHtml ?? '');
        setSeoTitle(tr.seoTitle ?? '');
        setSeoDescription(tr.seoDescription ?? '');
      }
      setTemplate(data.template ?? 'default');
    })();
  }, [pageId]);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function save(opts: { publish?: boolean; trash?: boolean } = {}) {
    if (!page) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const tr = page.translations[0];
    let nextStatus: string | undefined;
    if (opts.trash) nextStatus = 'TRASHED';
    else if (opts.publish) nextStatus = 'PUBLISHED';

    const res = await fetch(`/api/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title,
        slug,
        contentHtml,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        template,
        version: page.version,
        languageId: tr?.languageId,
        ...(nextStatus ? { status: nextStatus } : {}),
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? `Save failed (${res.status})`);
      setSaving(false);
      return;
    }
    const data = (await res.json()) as Page;
    setPage(data);
    setMessage(opts.trash ? 'Trashed' : opts.publish ? 'Published' : 'Draft saved');
    setSaving(false);
  }

  if (!page && !error) return <p className="v-muted">Loading…</p>;

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Edit Page</h1>
        <Link href="/content/pages" className="v-btn">
          ← All Pages
        </Link>
      </div>
      {message ? <div className="v-alert v-alert--ok">{message}</div> : null}
      {error ? <div className="v-alert v-alert--error">{error}</div> : null}
      <div className="v-editor">
        <div>
          <input
            className="v-editor__title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Add title"
          />
          <div className="v-editor__slug">
            <span>Permalink:</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </div>
          <TiptapEditor value={contentHtml} onChange={setContentHtml} mode="page" />
        </div>
        <aside className="v-editor__meta">
          <section className="v-panel" style={{ marginTop: 0 }}>
            <h2 className="v-panel__h">Publish</h2>
            <div className="v-panel__b">
              <p style={{ margin: '0 0 8px' }}>
                Status:{' '}
                <span className={`v-status v-status--${(page?.status ?? 'DRAFT').toLowerCase()}`}>
                  {(page?.status ?? 'DRAFT').replaceAll('_', ' ').toLowerCase()}
                </span>
              </p>
              <div className="v-btn-row">
                <button
                  type="button"
                  className="v-btn v-btn--primary"
                  disabled={saving}
                  onClick={() => void save()}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className="v-btn v-btn--success"
                  disabled={saving}
                  onClick={() => void save({ publish: true })}
                >
                  Publish
                </button>
              </div>
              <button
                type="button"
                className="v-btn v-btn--danger"
                disabled={saving}
                onClick={() => {
                  if (confirm('Trash this page?')) void save({ trash: true });
                }}
              >
                Move to Trash
              </button>
            </div>
          </section>
          <section className="v-panel">
            <h2 className="v-panel__h">Page attributes</h2>
            <div className="v-panel__b">
              <label>
                Template
                <select value={template} onChange={(e) => setTemplate(e.target.value)}>
                  <option value="default">Default</option>
                  <option value="full-width">Full width</option>
                  <option value="landing">Landing</option>
                </select>
              </label>
            </div>
          </section>
          <section className="v-panel">
            <h2 className="v-panel__h">SEO</h2>
            <div className="v-panel__b">
              <label>
                SEO title
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </label>
              <label style={{ marginTop: 8 }}>
                Meta description
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                />
              </label>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
