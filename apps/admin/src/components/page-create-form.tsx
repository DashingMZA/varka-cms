'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { slugify } from '@/lib/slugify';
import { TiptapEditor } from '@/components/tiptap-editor';

export function PageCreateForm() {
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
      setError('Please enter a title');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          contentHtml,
          template,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Create failed (${res.status})`);
        setBusy(false);
        return;
      }
      const page = (await res.json()) as { id: string };
      if (publish) {
        await fetch(`/api/pages/${page.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'PUBLISHED', title: title.trim() }),
        }).catch(() => null);
      }
      router.push(`/content/pages/${page.id}`);
    } catch {
      setError('Network error');
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Add New Page</h1>
        <Link href="/content/pages" className="v-btn">
          ← All Pages
        </Link>
      </div>
      {error ? <div className="v-alert v-alert--error">{error}</div> : null}
      <div className="v-editor">
        <div>
          <input
            className="v-editor__title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Add title"
            autoFocus
          />
          <div className="v-editor__slug">
            <span>Permalink:</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="auto-from-title"
            />
          </div>
          <label className="v-muted" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
            Content
          </label>
          <TiptapEditor value={contentHtml} onChange={setContentHtml} mode="page" />
        </div>
        <aside className="v-editor__meta">
          <section className="v-panel" style={{ marginTop: 0 }}>
            <h2 className="v-panel__h">Publish</h2>
            <div className="v-panel__b">
              <p className="v-muted" style={{ marginTop: 0 }}>
                Not saved until you click Save Draft or Publish.
              </p>
              <div className="v-btn-row">
                <button
                  type="button"
                  className="v-btn v-btn--primary"
                  disabled={busy || !title.trim()}
                  onClick={() => void create(false)}
                >
                  {busy ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  className="v-btn v-btn--success"
                  disabled={busy || !title.trim()}
                  onClick={() => void create(true)}
                >
                  Publish
                </button>
              </div>
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
        </aside>
      </div>
    </div>
  );
}
