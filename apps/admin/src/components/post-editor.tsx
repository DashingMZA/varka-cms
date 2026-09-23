'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { MediaLibrary, type MediaInsertPayload } from './media-library';
import { TiptapEditor } from '@/components/tiptap-editor';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';
import { slugify } from '@/lib/slugify';
import { useAutosave } from '@/hooks/use-autosave';

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

type Post = {
  id: string;
  status: string;
  version: number;
  publishedAt?: string | null;
  featuredImageId?: string | null;
  translations: Translation[];
  categories?: Array<{ categoryId: string }>;
  tags?: Array<{ tagId: string }>;
};

type CatItem = {
  id: string;
  translations?: Array<{ name?: string }>;
};

type TagItem = {
  id: string;
  translations?: Array<{ name?: string }>;
};

export function PostEditor({ postId }: { postId: string }) {
  const { t } = useMessages();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [contentHtml, setContentHtml] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<'insert' | 'featured'>('insert');
  const [featuredUrl, setFeaturedUrl] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<CatItem[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [boxes, setBoxes] = useState({
    publish: true,
    featured: true,
    excerpt: true,
    seo: true,
    categories: true,
    tags: true,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('varka.screen.post-editor');
      if (raw) setBoxes((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/posts/${postId}`, { credentials: 'include' });
      if (!res.ok) {
        setError(`Load failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as Post;
      setPost(data);
      setStatus(data.status);
      const tr = data.translations[0];
      if (tr) {
        setTitle(tr.title);
        setSlug(tr.slug);
        setContentHtml(tr.contentHtml ?? '');
        setExcerpt(tr.excerpt ?? '');
        setSeoTitle(tr.seoTitle ?? '');
        setSeoDescription(tr.seoDescription ?? '');
        setSlugTouched(Boolean(tr.slug && tr.slug !== 'untitled'));
      }
      setCategoryIds((data.categories ?? []).map((c) => c.categoryId));
      setTagIds((data.tags ?? []).map((tg) => tg.tagId));
    })();
  }, [postId]);

  useEffect(() => {
    void (async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          fetch('/api/categories', { credentials: 'include' }),
          fetch('/api/tags', { credentials: 'include' }),
        ]);
        if (cRes.ok) {
          const d = (await cRes.json()) as { items?: CatItem[] };
          setAllCategories(d.items ?? []);
        }
        if (tRes.ok) {
          const d = (await tRes.json()) as { items?: TagItem[] };
          setAllTags(d.items ?? []);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function toggleBox(key: keyof typeof boxes) {
    setBoxes((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('varka.screen.post-editor', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const save = useCallback(
    async (publish = false, silent = false) => {
      if (!post) return;
      if (!title.trim()) {
        if (!silent) setError(t('blogs', 'titleRequired', 'Title is required before save'));
        return;
      }
      if (!silent) {
        setMessage(null);
        setError(null);
      }
      setSaving(true);
      const tr = post.translations[0];
      if (!tr) {
        setError('No translation');
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          contentHtml,
          excerpt: excerpt || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          version: post.version,
          languageId: tr.languageId,
          categoryIds,
          tagIds,
          ...(publish ? { status: 'PUBLISHED' } : { status }),
        }),
      });
      setSaving(false);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!silent) setError(body.error ?? `Save failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as Post;
      setPost(data);
      setStatus(data.status);
      if (!silent) {
        setMessage(
          publish
            ? t('blogs', 'publishedMsg', 'Published')
            : t('blogs', 'savedMsg', 'Saved'),
        );
      } else {
        setMessage(t('blogs', 'autosaved', 'Draft saved'));
      }
    },
    [
      post,
      title,
      slug,
      contentHtml,
      excerpt,
      seoTitle,
      seoDescription,
      status,
      postId,
      categoryIds,
      tagIds,
      t,
    ],
  );

  useAutosave(
    Boolean(post && title.trim()),
    [title, slug, contentHtml, excerpt, seoTitle, seoDescription, categoryIds, tagIds, status],
    () => save(false, true),
  );

  function insertMedia(payload: MediaInsertPayload) {
    const dim =
      payload.width && payload.height
        ? ` width="${payload.width}" height="${payload.height}"`
        : '';
    const fig =
      payload.asset.caption || payload.alt
        ? `<figure class="wp-block-image size-${payload.size}"><img src="${payload.src}" alt="${escapeAttr(payload.alt)}"${dim} loading="lazy" decoding="async" /><figcaption>${escapeHtml(payload.asset.caption || payload.alt)}</figcaption></figure>\n`
        : `<p><img src="${payload.src}" alt="${escapeAttr(payload.alt)}"${dim} loading="lazy" decoding="async" /></p>\n`;
    setContentHtml((prev) => (prev ? `${prev}\n${fig}` : fig));
    setMediaOpen(false);
    setMessage(t('blogs', 'imageInserted', 'Image inserted'));
  }

  function setFeatured(payload: MediaInsertPayload) {
    setFeaturedUrl(payload.src);
    setMediaOpen(false);
    setMessage(`${t('blogs', 'featuredImage')} ${t('blogs', 'set', 'set')}`);
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (!post && !error) return <p className="v-muted">{t('blogs', 'loading', 'Loading…')}</p>;

  const isPublished = status === 'PUBLISHED';

  return (
    <div>
      <ScreenMeta
        help={[
          {
            id: 'title',
            title: 'Title & editor',
            body: 'Enter a title; the permalink slug updates automatically until you edit it. Use Add Media to insert images.',
          },
          {
            id: 'publish',
            title: t('blogs', 'publishBox'),
            body: 'Save Draft keeps the post unpublished. Publish sets status to PUBLISHED.',
          },
        ]}
        options={[
          {
            id: 'publish',
            label: t('blogs', 'publishBox'),
            checked: boxes.publish,
            onChange: () => toggleBox('publish'),
          },
          {
            id: 'featured',
            label: t('blogs', 'featuredImage'),
            checked: boxes.featured,
            onChange: () => toggleBox('featured'),
          },
          {
            id: 'categories',
            label: t('blogs', 'categories'),
            checked: boxes.categories,
            onChange: () => toggleBox('categories'),
          },
          {
            id: 'tags',
            label: t('blogs', 'tags'),
            checked: boxes.tags,
            onChange: () => toggleBox('tags'),
          },
          {
            id: 'excerpt',
            label: t('blogs', 'excerpt'),
            checked: boxes.excerpt,
            onChange: () => toggleBox('excerpt'),
          },
          {
            id: 'seo',
            label: t('blogs', 'seo'),
            checked: boxes.seo,
            onChange: () => toggleBox('seo'),
          },
        ]}
      />

      <div className="v-page-header">
        <h1 className="v-page-title">{t('blogs', 'editPost')}</h1>
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
            placeholder={t('blogs', 'addTitle', 'Add title')}
          />
          <p className="v-editor__slug">
            {t('blogs', 'slug')}:{' '}
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </p>

          <div className="v-btn-row">
            <button
              type="button"
              className="v-btn"
              onClick={() => {
                setMediaMode('insert');
                setMediaOpen(true);
              }}
            >
              {t('blogs', 'addMedia', 'Add Media')}
            </button>
          </div>

          <TiptapEditor
            value={contentHtml}
            onChange={setContentHtml}
            placeholder={t('blogs', 'writeContent', 'Write content…')}
            onInsertImage={() => {
              setMediaMode('insert');
              setMediaOpen(true);
            }}
          />

          {boxes.excerpt ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'excerpt')}</h3>
              <div className="v-panel__b">
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  placeholder={t('blogs', 'excerptHelp', 'Write an excerpt (optional)')}
                />
              </div>
            </div>
          ) : null}

          {boxes.seo ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'seo')}</h3>
              <div className="v-panel__b" style={{ display: 'grid', gap: 8 }}>
                <label>
                  {t('blogs', 'seoTitle')}
                  <input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                  />
                </label>
                <label>
                  {t('blogs', 'seoDescription')}
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                  />
                </label>
                <div
                  style={{
                    border: '1px solid var(--wp-border)',
                    borderRadius: 3,
                    padding: 12,
                    background: '#fff',
                    maxWidth: 600,
                  }}
                >
                  <div style={{ color: '#1a0dab', fontSize: 18, lineHeight: 1.3 }}>
                    {seoTitle || title || t('blogs', 'addTitle', 'Add title')}
                  </div>
                  <div style={{ color: '#006621', fontSize: 13 }}>
                    example.com/{slug || '…'}
                  </div>
                  <div style={{ color: '#545454', fontSize: 13, marginTop: 2 }}>
                    {seoDescription ||
                      excerpt ||
                      t('blogs', 'noDescription', 'No description')}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="v-editor__side">
          {boxes.publish ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'publishBox')}</h3>
              <div className="v-panel__b">
                <p style={{ margin: '0 0 8px' }}>
                  {t('blogs', 'status')}:{' '}
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="DRAFT">{t('blogs', 'draft')}</option>
                    <option value="PENDING_REVIEW">{t('blogs', 'pendingReview')}</option>
                    <option value="PUBLISHED">{t('blogs', 'published')}</option>
                  </select>
                </p>
                <p className="v-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
                  Version {post?.version}
                  {saving ? ` · ${t('blogs', 'saving', 'Saving…')}` : null}
                </p>
                <div className="v-btn-row">
                  <button type="button" className="v-btn" onClick={() => void save(false)} disabled={saving}>
                    {t('blogs', 'saveDraft', 'Save Draft')}
                  </button>
                  <button
                    type="button"
                    className="v-btn v-btn--primary"
                    onClick={() => void save(true)}
                    disabled={saving}
                  >
                    {isPublished ? t('blogs', 'update') : t('blogs', 'publish')}
                  </button>
                </div>
                <p style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="v-btn"
                    style={{ color: 'var(--wp-danger)' }}
                    onClick={() => {
                      setStatus('TRASHED');
                      void save(false);
                    }}
                  >
                    {t('blogs', 'moveToTrash')}
                  </button>
                </p>
              </div>
            </div>
          ) : null}

          {boxes.featured ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'featuredImage')}</h3>
              <div className="v-panel__b">
                {featuredUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredUrl}
                    alt=""
                    style={{ maxWidth: '100%', marginBottom: 8, borderRadius: 3 }}
                  />
                ) : (
                  <p className="v-muted" style={{ fontSize: 12 }}>
                    {t('blogs', 'noFeatured', 'No featured image')}
                  </p>
                )}
                <button
                  type="button"
                  className="v-btn"
                  onClick={() => {
                    setMediaMode('featured');
                    setMediaOpen(true);
                  }}
                >
                  {featuredUrl
                    ? t('blogs', 'replaceFeatured', 'Replace image')
                    : t('blogs', 'setFeatured')}
                </button>
                {featuredUrl ? (
                  <button
                    type="button"
                    className="v-btn"
                    style={{ marginLeft: 6 }}
                    onClick={() => setFeaturedUrl(null)}
                  >
                    {t('blogs', 'removeFeatured')}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {boxes.categories ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'categories')}</h3>
              <div className="v-panel__b">
                {allCategories.length === 0 ? (
                  <p className="v-muted" style={{ fontSize: 12, margin: 0 }}>
                    {t('blogs', 'noCategories', 'No categories yet.')}
                  </p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {allCategories.map((c) => {
                      const name = c.translations?.[0]?.name ?? c.id;
                      return (
                        <li key={c.id} style={{ marginBottom: 4 }}>
                          <label style={{ fontWeight: 400, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              checked={categoryIds.includes(c.id)}
                              onChange={() => toggleCategory(c.id)}
                            />
                            {name}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          {boxes.tags ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'tags')}</h3>
              <div className="v-panel__b">
                {allTags.length === 0 ? (
                  <p className="v-muted" style={{ fontSize: 12, margin: 0 }}>
                    {t('blogs', 'noTags', 'No tags yet.')}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {allTags.map((tg) => {
                      const name = tg.translations?.[0]?.name ?? tg.id;
                      const on = tagIds.includes(tg.id);
                      return (
                        <button
                          key={tg.id}
                          type="button"
                          className="v-btn"
                          style={{
                            fontWeight: on ? 700 : 400,
                            background: on ? '#dbeafe' : undefined,
                          }}
                          onClick={() => toggleTag(tg.id)}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="v-muted" style={{ fontSize: 11, marginTop: 8 }}>
                  {t('blogs', 'addTags', 'Separate tags with commas')}
                </p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {mediaOpen ? (
        <div className="v-media-modal" role="dialog" aria-modal="true" aria-label="Media">
          <div className="v-media-modal__frame">
            <div className="v-media-modal__bar">
              <strong>{t('blogs', 'mediaLibrary')}</strong>
              <button type="button" className="v-btn" onClick={() => setMediaOpen(false)}>
                {t('blogs', 'close', 'Close')}
              </button>
            </div>
            <div className="v-media-modal__body">
              <MediaLibrary
                imagesOnly
                onClose={() => setMediaOpen(false)}
                onInsert={(p) => {
                  if (mediaMode === 'featured') setFeatured(p);
                  else insertMedia(p);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
