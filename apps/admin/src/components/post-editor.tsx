'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Translation = {
  id: string;
  languageId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
};

type Post = {
  id: string;
  status: string;
  version: number;
  updatedAt?: string;
  publishedAt?: string | null;
  translations: Translation[];
};

function statusClass(status: string): string {
  return `v-status v-status--${status.toLowerCase()}`;
}

export function PostEditor({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/posts/${postId}`, { credentials: 'include' });
      if (!res.ok) {
        setError(`Load failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as Post;
      setPost(data);
      const tr = data.translations[0];
      if (tr) {
        setTitle(tr.title);
        setSlug(tr.slug);
        setExcerpt(tr.excerpt ?? '');
        setContentHtml(tr.contentHtml ?? '');
      }
    })();
  }, [postId]);

  async function save(opts: { publish?: boolean; trash?: boolean } = {}) {
    if (!post) return;
    setMessage(null);
    setError(null);
    setSaving(true);
    const tr = post.translations[0];
    if (!tr) {
      setError('No translation');
      setSaving(false);
      return;
    }

    let status: string | undefined;
    if (opts.trash) status = 'TRASHED';
    else if (opts.publish) status = 'PUBLISHED';

    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title,
        slug,
        excerpt: excerpt || null,
        contentHtml,
        version: post.version,
        languageId: tr.languageId,
        ...(status ? { status } : {}),
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? `Save failed (${res.status})`);
      setSaving(false);
      return;
    }
    const data = (await res.json()) as Post;
    setPost(data);
    setMessage(opts.trash ? 'Moved to Trash' : opts.publish ? 'Published' : 'Draft saved');
    setSaving(false);
  }

  if (!post && !error) {
    return <p className="v-muted">Loading…</p>;
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Edit Post</h1>
        <Link href="/content/posts" className="v-btn">
          ← All Posts
        </Link>
      </div>

      {message ? <div className="v-alert v-alert--ok">{message}</div> : null}
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
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            aria-label="Post title"
          />
          <div className="v-editor__slug">
            <span>Permalink:</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              aria-label="Slug"
            />
          </div>
          <label className="v-muted" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
            Content
          </label>
          <textarea
            className="v-editor__body"
            value={contentHtml}
            onChange={(e) => setContentHtml(e.target.value)}
            placeholder="Write your post (HTML for now — Tiptap can replace this surface later)"
            aria-label="Post body"
          />
        </div>

        <aside className="v-editor__meta">
          <section className="v-panel" style={{ marginTop: 0 }}>
            <h2 className="v-panel__h">Publish</h2>
            <div className="v-panel__b">
              <p style={{ margin: '0 0 8px' }}>
                Status:{' '}
                <span className={statusClass(post?.status ?? 'DRAFT')}>
                  {(post?.status ?? 'DRAFT').replaceAll('_', ' ').toLowerCase()}
                </span>
              </p>
              <p className="v-muted" style={{ margin: '0 0 8px', fontSize: 12 }}>
                Version v{post?.version}
                {post?.updatedAt
                  ? ` · Updated ${new Date(post.updatedAt).toLocaleString()}`
                  : ''}
              </p>
              <div className="v-btn-row" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="v-btn v-btn--primary"
                  disabled={saving || !post}
                  onClick={() => void save(false)}
                >
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  className="v-btn v-btn--success"
                  disabled={saving || !post}
                  onClick={() => void save({ publish: true })}
                >
                  Publish
                </button>
              </div>
              <div className="v-btn-row">
                <button
                  type="button"
                  className="v-btn v-btn--danger"
                  disabled={saving || !post}
                  onClick={() => {
                    if (confirm('Move this post to Trash?')) void save({ trash: true });
                  }}
                >
                  Move to Trash
                </button>
              </div>
            </div>
          </section>

          <section className="v-panel">
            <h2 className="v-panel__h">Excerpt</h2>
            <div className="v-panel__b">
              <textarea
                rows={4}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Optional summary for listings and SEO"
              />
            </div>
          </section>

          <section className="v-panel">
            <h2 className="v-panel__h">Document</h2>
            <div className="v-panel__b">
              <p className="v-muted" style={{ margin: 0, fontSize: 12 }}>
                Post ID: <code>{postId}</code>
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
