'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { slugify } from '@/lib/slugify';
import { TiptapEditor } from '@/components/tiptap-editor';
import {
  FeaturedImagePanel,
  type FeaturedMedia,
} from '@/components/featured-image-panel';
import { useAutosave } from '@/hooks/use-autosave';

type TaxItem = { id: string; translations: Array<{ name: string }> };

function taxName(t: TaxItem) {
  return t.translations?.[0]?.name ?? t.id;
}

/**
 * WordPress-style Add New Post:
 * - Empty title/permalink until typing
 * - No DB write while title empty
 * - Autosave draft once title is non-empty
 * - Full sidebar: publish, featured, cats, tags, excerpt, SEO
 */
export function PostCreateForm() {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [contentHtml, setContentHtml] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<TaxItem[]>([]);
  const [allTags, setAllTags] = useState<TaxItem[]>([]);
  const [mediaItems, setMediaItems] = useState<FeaturedMedia[]>([]);
  const [featuredImage, setFeaturedImage] = useState<FeaturedMedia | null>(null);
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState('');
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoStatus, setAutoStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    void (async () => {
      const [catRes, tagRes, mediaRes] = await Promise.all([
        fetch('/api/categories', { credentials: 'include' }),
        fetch('/api/tags', { credentials: 'include' }),
        fetch('/api/media', { credentials: 'include' }),
      ]);
      if (catRes.ok) {
        const c = (await catRes.json()) as { items: TaxItem[] };
        setAllCategories(c.items ?? []);
      }
      if (tagRes.ok) {
        const t = (await tagRes.json()) as { items: TaxItem[] };
        setAllTags(t.items ?? []);
      }
      if (mediaRes.ok) {
        const m = (await mediaRes.json()) as { items: FeaturedMedia[] };
        setMediaItems((m.items ?? []).filter((x) => x.mimeType?.startsWith('image/')));
      }
    })();
  }, []);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  const persist = useCallback(
    async (opts: { publish?: boolean; silent?: boolean } = {}) => {
      if (!title.trim()) {
        if (!opts.silent) setError('Please enter a title');
        return null;
      }
      if (!opts.silent) {
        setBusy(true);
        setError(null);
      } else {
        setAutoStatus('saving');
      }

      try {
        if (!postId) {
          const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              title: title.trim(),
              slug: slug.trim() || undefined,
              contentHtml: contentHtml || '',
              excerpt: excerpt || null,
            }),
          });
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            if (!opts.silent) setError(body.error ?? `Create failed (${res.status})`);
            setBusy(false);
            setAutoStatus('idle');
            return null;
          }
          const created = (await res.json()) as {
            id: string;
            version?: number;
            translations?: Array<{ languageId: string }>;
          };
          setPostId(created.id);
          setVersion(created.version ?? 1);

          // Apply sidebar fields on first create via PATCH
          await fetch(`/api/posts/${created.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              title: title.trim(),
              slug: slug.trim() || undefined,
              contentHtml,
              excerpt: excerpt || null,
              seoTitle: seoTitle || null,
              seoDescription: seoDescription || null,
              categoryIds,
              tagIds,
              featuredImageId,
              languageId: created.translations?.[0]?.languageId,
              ...(opts.publish ? { status: 'PUBLISHED' } : {}),
            }),
          }).catch(() => null);

          if (opts.publish) {
            router.push(`/content/posts/${created.id}`);
            return created.id;
          }
          if (!opts.silent) {
            setMessage('Draft saved');
            router.replace(`/content/posts/${created.id}`);
          } else {
            setAutoStatus('saved');
            // Stay on /new until user navigates — replace URL so refresh works
            window.history.replaceState(null, '', `/content/posts/${created.id}`);
          }
          setBusy(false);
          return created.id;
        }

        // Existing draft — PATCH
        const res = await fetch(`/api/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: title.trim(),
            slug: slug.trim() || undefined,
            contentHtml,
            excerpt: excerpt || null,
            seoTitle: seoTitle || null,
            seoDescription: seoDescription || null,
            categoryIds,
            tagIds,
            featuredImageId,
            version,
            ...(opts.publish ? { status: 'PUBLISHED' } : {}),
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          if (!opts.silent) setError(body.error ?? `Save failed (${res.status})`);
          setBusy(false);
          setAutoStatus('idle');
          return null;
        }
        const data = (await res.json()) as { version?: number };
        if (data.version) setVersion(data.version);
        if (opts.publish) {
          router.push(`/content/posts/${postId}`);
        } else if (!opts.silent) {
          setMessage(opts.publish ? 'Published' : 'Draft saved');
        } else {
          setAutoStatus('saved');
        }
        setBusy(false);
        return postId;
      } catch {
        if (!opts.silent) setError('Network error');
        setBusy(false);
        setAutoStatus('idle');
        return null;
      }
    },
    [
      title,
      slug,
      contentHtml,
      excerpt,
      seoTitle,
      seoDescription,
      categoryIds,
      tagIds,
      featuredImageId,
      postId,
      version,
      router,
    ],
  );

  // Autosave only when title is non-empty
  useAutosave(
    Boolean(title.trim()),
    [title, slug, contentHtml, excerpt, seoTitle, seoDescription, categoryIds, tagIds, featuredImageId],
    () => persist({ silent: true }),
    2500,
  );

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

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Add New Post</h1>
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
              <p className="v-muted" style={{ marginTop: 0, fontSize: 12 }}>
                {!title.trim()
                  ? 'Enter a title to enable saving. Empty titles are never saved.'
                  : autoStatus === 'saving'
                    ? 'Autosaving…'
                    : autoStatus === 'saved' || postId
                      ? 'Draft saved'
                      : 'Ready to save'}
              </p>
              <div className="v-btn-row">
                <button
                  type="button"
                  className="v-btn v-btn--primary"
                  disabled={busy || !title.trim()}
                  onClick={() => void persist({ publish: false })}
                >
                  {busy ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  className="v-btn v-btn--success"
                  disabled={busy || !title.trim()}
                  onClick={() => void persist({ publish: true })}
                >
                  Publish
                </button>
              </div>
            </div>
          </section>

          <FeaturedImagePanel
            value={featuredImage}
            library={mediaItems}
            onChange={(a) => {
              setFeaturedImage(a);
              setFeaturedImageId(a?.id ?? null);
            }}
            onLibraryAdd={(a) =>
              setMediaItems((prev) => (prev.some((x) => x.id === a.id) ? prev : [a, ...prev]))
            }
          />

          <section className="v-panel">
            <h2 className="v-panel__h">Categories</h2>
            <div className="v-panel__b">
              <div style={{ display: 'grid', gap: 4, maxHeight: 140, overflow: 'auto' }}>
                {allCategories.map((c) => (
                  <label key={c.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(c.id)}
                      onChange={(e) =>
                        setCategoryIds((prev) =>
                          e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                        )
                      }
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
                      onChange={(e) =>
                        setTagIds((prev) =>
                          e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id),
                        )
                      }
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
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
