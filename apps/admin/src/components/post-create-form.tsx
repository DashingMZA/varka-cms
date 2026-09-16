'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { slugify } from '@/lib/slugify';
import { TiptapEditor } from '@/components/tiptap-editor';

/**
 * WordPress-style: empty title/permalink until user types.
 * No DB row until Save Draft / Publish.
 */
export function PostCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [contentHtml, setContentHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function create(publish: boolean) {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          contentHtml: contentHtml || '',
          ...(publish ? { status: 'PUBLISHED' } : {}),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Create failed (${res.status})`);
        setBusy(false);
        return;
      }
      const post = (await res.json()) as { id: string };
      if (publish) {
        await fetch(`/api/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'PUBLISHED', title: title.trim() }),
        }).catch(() => null);
      }
      router.push(`/content/posts/${post.id}`);
    } catch {
      setError('Network error');
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Add New Post</h1>
        <Link href="/content/posts" className="v-btn">
          ← All Posts
        </Link>
      </div>

      {error ? (
        <div className="v-alert v-alert--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="v-editor">
        <div>
          <input
            className="v-editor__title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Add title"
            aria-label="Post title"
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
              aria-label="Slug"
            />
          </div>
          <label className="v-muted" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
            Content
          </label>
          <TiptapEditor value={contentHtml} onChange={setContentHtml} />
        </div>

        <aside className="v-editor__meta">
          <section className="v-panel" style={{ marginTop: 0 }}>
            <h2 className="v-panel__h">Publish</h2>
            <div className="v-panel__b">
              <p className="v-muted" style={{ marginTop: 0 }}>
                Status: <strong>not saved</strong> — nothing is written to the database until you
                save.
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
        </aside>
      </div>
    </div>
  );
}
