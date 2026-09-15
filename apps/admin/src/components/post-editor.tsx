'use client';

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
  translations: Translation[];
};

export function PostEditor({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setContentHtml(tr.contentHtml ?? '');
      }
    })();
  }, [postId]);

  async function save(publish = false) {
    if (!post) return;
    setMessage(null);
    setError(null);
    const tr = post.translations[0];
    if (!tr) {
      setError('No translation');
      return;
    }
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title,
        slug,
        contentHtml,
        version: post.version,
        languageId: tr.languageId,
        ...(publish ? { status: 'PUBLISHED' } : {}),
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? `Save failed (${res.status})`);
      return;
    }
    const data = (await res.json()) as Post;
    setPost(data);
    setMessage(publish ? 'Published' : 'Saved');
  }

  if (!post && !error) return <p style={{ color: 'var(--muted)' }}>Loading…</p>;

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 800 }}>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={field}
        />
      </label>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
       Slug
        <input value={slug} onChange={(e) => setSlug(e.target.value)} style={field} />
      </label>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        Body (HTML — Tiptap wires in full editor install)
        <textarea
          value={contentHtml}
          onChange={(e) => setContentHtml(e.target.value)}
          rows={16}
          style={{ ...field, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
        />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => void save(false)} style={btn}>
          Save draft
        </button>
        <button
          type="button"
          onClick={() => void save(true)}
          style={{ ...btn, background: '#15803d' }}
        >
          Publish
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 13, alignSelf: 'center' }}>
          v{post?.version} · {post?.status}
        </span>
      </div>
      {message ? <p style={{ color: '#15803d', margin: 0 }}>{message}</p> : null}
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

const field: Record<string, string | number> = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: '#fff',
};

const btn: Record<string, string | number> = {
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
};
