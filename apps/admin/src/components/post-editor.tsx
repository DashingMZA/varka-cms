'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TiptapEditor } from '@/components/tiptap-editor';

type Translation = {
  id: string;
  languageId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type TaxNode = {
  id: string;
  translations?: Array<{ name: string }>;
};

type MediaAsset = {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  storage: string;
  alt?: string | null;
};

type Post = {
  id: string;
  status: string;
  version: number;
  updatedAt?: string;
  featuredImageId?: string | null;
  featuredImage?: MediaAsset | null;
  translations: Translation[];
  categories?: Array<{ category: TaxNode }>;
  tags?: Array<{ tag: TaxNode }>;
};

type TaxItem = {
  id: string;
  translations: Array<{ name: string }>;
};

function statusClass(status: string): string {
  return `v-status v-status--${status.toLowerCase()}`;
}

function taxName(t: TaxNode | TaxItem): string {
  return t.translations?.[0]?.name ?? t.id;
}

function mediaUrl(a: MediaAsset): string {
  if (a.storage === 'local') return `/api/media/file/${a.key}`;
  return a.key.startsWith('http') ? a.key : `/api/media/file/${a.key}`;
}

export function PostEditor({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<MediaAsset | null>(null);
  const [allCategories, setAllCategories] = useState<TaxItem[]>([]);
  const [allTags, setAllTags] = useState<TaxItem[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    void (async () => {
      const [postRes, catRes, tagRes, mediaRes] = await Promise.all([
        fetch(`/api/posts/${postId}`, { credentials: 'include' }),
        fetch('/api/categories', { credentials: 'include' }),
        fetch('/api/tags', { credentials: 'include' }),
        fetch('/api/media', { credentials: 'include' }),
      ]);

      if (!postRes.ok) {
        setError(`Load failed (${postRes.status})`);
        return;
      }
      const data = (await postRes.json()) as Post;
      setPost(data);
      const tr = data.translations[0];
      if (tr) {
        setTitle(tr.title);
        setSlug(tr.slug);
        setExcerpt(tr.excerpt ?? '');
        setContentHtml(tr.contentHtml ?? '');
        setSeoTitle(tr.seoTitle ?? '');
        setSeoDescription(tr.seoDescription ?? '');
      }
      setCategoryIds((data.categories ?? []).map((c) => c.category.id));
      setTagIds((data.tags ?? []).map((t) => t.tag.id));
      setFeaturedImageId(data.featuredImageId ?? null);
      setFeaturedImage(data.featuredImage ?? null);

      if (catRes.ok) {
        const c = (await catRes.json()) as { items: TaxItem[] };
        setAllCategories(c.items ?? []);
      }
      if (tagRes.ok) {
        const t = (await tagRes.json()) as { items: TaxItem[] };
        setAllTags(t.items ?? []);
      }
      if (mediaRes.ok) {
        const m = (await mediaRes.json()) as { items: MediaAsset[] };
        setMediaItems((m.items ?? []).filter((x) => x.mimeType.startsWith('image/')));
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

    let nextStatus: string | undefined;
    if (opts.trash) nextStatus = 'TRASHED';
    else if (opts.publish) nextStatus = 'PUBLISHED';

    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title,
        slug,
        excerpt: excerpt || null,
        contentHtml,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        categoryIds,
        tagIds,
        featuredImageId,
        version: post.version,
        languageId: tr.languageId,
        ...(nextStatus ? { status: nextStatus } : {}),
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
    setFeaturedImage(data.featuredImage ?? null);
    setMessage(opts.trash ? 'Moved to Trash' : opts.publish ? 'Published' : 'Draft saved');
    setSaving(false);
  }

  async function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    const cat = (await res.json()) as TaxItem;
    setAllCategories((prev) => [...prev, cat]);
    setCategoryIds((prev) => [...prev, cat.id]);
    setNewCat('');
  }

  async function addTag() {
    const name = newTag.trim();
    if (!name) return;
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    const tag = (await res.json()) as TaxItem;
    setAllTags((prev) => [...prev, tag]);
    setTagIds((prev) => [...prev, tag.id]);
    setNewTag('');
  }

  function pickFeatured(id: string | null) {
    setFeaturedImageId(id);
    if (!id) {
      setFeaturedImage(null);
      return;
    }
    const m = mediaItems.find((x) => x.id === id) ?? null;
    setFeaturedImage(m);
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
            <input value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Slug" />
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
                  onClick={() => void save()}
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
            <h2 className="v-panel__h">Featured image</h2>
            <div className="v-panel__b">
              {featuredImage ? (
                <div style={{ marginBottom: 8 }}>
                  <img
                    src={mediaUrl(featuredImage)}
                    alt={featuredImage.alt ?? featuredImage.filename}
                    style={{
                      width: '100%',
                      maxHeight: 140,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid var(--wp-border)',
                    }}
                  />
                  <button type="button" className="v-btn" style={{ marginTop: 6 }} onClick={() => pickFeatured(null)}>
                    Remove
                  </button>
                </div>
              ) : (
                <p className="v-muted" style={{ marginTop: 0 }}>
                  No image selected.
                </p>
              )}
              <select
                value={featuredImageId ?? ''}
                onChange={(e) => pickFeatured(e.target.value || null)}
                style={{ width: '100%', padding: 6 }}
              >
                <option value="">— Select from Media —</option>
                {mediaItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.filename}
                  </option>
                ))}
              </select>
              <p className="v-muted" style={{ fontSize: 11, margin: '6px 0 0' }}>
                Upload new files in <Link href="/media">Media</Link>.
              </p>
            </div>
          </section>

          <section className="v-panel">
            <h2 className="v-panel__h">Categories</h2>
            <div className="v-panel__b">
              <div style={{ display: 'grid', gap: 4, maxHeight: 160, overflow: 'auto' }}>
                {allCategories.map((c) => (
                  <label key={c.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(c.id)}
                      onChange={(e) => {
                        setCategoryIds((prev) =>
                          e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                        );
                      }}
                    />
                    {taxName(c)}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <input
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="New category"
                  style={{ flex: 1, padding: 6 }}
                />
                <button type="button" className="v-btn" onClick={() => void addCategory()}>
                  Add
                </button>
              </div>
            </div>
          </section>

          <section className="v-panel">
            <h2 className="v-panel__h">Tags</h2>
            <div className="v-panel__b">
              <div style={{ display: 'grid', gap: 4, maxHeight: 120, overflow: 'auto' }}>
                {allTags.map((t) => (
                  <label key={t.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      checked={tagIds.includes(t.id)}
                      onChange={(e) => {
                        setTagIds((prev) =>
                          e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id),
                        );
                      }}
                    />
                    {taxName(t)}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="New tag"
                  style={{ flex: 1, padding: 6 }}
                />
                <button type="button" className="v-btn" onClick={() => void addTag()}>
                  Add
                </button>
              </div>
            </div>
          </section>

          <section className="v-panel">
            <h2 className="v-panel__h">Excerpt</h2>
            <div className="v-panel__b">
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Optional summary"
              />
            </div>
          </section>

          <section className="v-panel">
            <h2 className="v-panel__h">SEO</h2>
            <div className="v-panel__b">
              <label>
                SEO title
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={200} />
              </label>
              <label style={{ marginTop: 8 }}>
                Meta description
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  maxLength={500}
                />
              </label>
              <p className="v-muted" style={{ fontSize: 11, margin: '6px 0 0' }}>
                {(seoTitle || title).length}/60 title · {seoDescription.length}/160 description (guide)
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
