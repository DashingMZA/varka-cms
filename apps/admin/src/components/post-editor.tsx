'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { MediaLibrary, type MediaInsertPayload } from './media-library';
import { TiptapEditor } from '@/components/tiptap-editor';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';
import { slugify } from '@/lib/slugify';
import { useAutosave } from '@/hooks/use-autosave';
import { getPostAction, updatePostAction } from '@/actions/posts';
import { listCategoriesAction, listTagsAction } from '@/actions/taxonomy';

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

type CatItem = { id: string; translations?: Array<{ name?: string }> };
type TagItem = { id: string; translations?: Array<{ name?: string }> };

function escapeAttr(s: string) {
  return s.replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<');
}
function escapeHtml(s: string) {
  return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
}

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
      const result = await getPostAction(postId);
      if (!result.ok) {
        setError(result.error || 'Load failed');
        return;
      }
      const data = result.data as Post;
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
      const [cRes, tRes] = await Promise.all([listCategoriesAction(), listTagsAction()]);
      if (cRes.ok) setAllCategories((cRes.data.items as CatItem[]) ?? []);
      if (tRes.ok) setAllTags((tRes.data.items as TagItem[]) ?? []);
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
      const result = await updatePostAction(postId, {
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
      });
      setSaving(false);
      if (!result.ok) {
        if (!silent) setError(result.error || 'Save failed');
        return;
      }
      const data = result.data as Post;
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
        ? `<figure class="wp-block-image"><img src="${payload.src}" alt="${escapeAttr(payload.alt)}"${dim} loading="lazy" /><figcaption>${escapeHtml(payload.asset.caption || payload.alt)}</figcaption></figure>\n`
        : `<p><img src="${payload.src}" alt="${escapeAttr(payload.alt)}"${dim} loading="lazy" /></p>\n`;
    setContentHtml((prev) => (prev ? `${prev}\n${fig}` : fig));
    setMediaOpen(false);
  }

  function setFeatured(payload: MediaInsertPayload) {
    setFeaturedUrl(payload.src);
    setMediaOpen(false);
  }

  if (!post && !error) return <p className="v-muted">{t('blogs', 'loading', 'Loading…')}</p>;
  const isPublished = status === 'PUBLISHED';

  return (
    <div>
      <ScreenMeta
        help={[{ id: 'title', title: 'Editor', body: 'Title, content, publish box.' }]}
        options={Object.entries(boxes).map(([id, checked]) => ({
          id,
          label: id,
          checked,
          onChange: () => toggleBox(id as keyof typeof boxes),
        }))}
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
                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />
              </div>
            </div>
          ) : null}
          {boxes.seo ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'seo')}</h3>
              <div className="v-panel__b" style={{ display: 'grid', gap: 8 }}>
                <label>
                  {t('blogs', 'seoTitle')}
                  <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                </label>
                <label>
                  {t('blogs', 'seoDescription')}
                  <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} />
                </label>
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
              </div>
            </div>
          ) : null}

          {boxes.featured ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'featuredImage')}</h3>
              <div className="v-panel__b">
                {featuredUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featuredUrl} alt="" style={{ maxWidth: '100%', marginBottom: 8 }} />
                ) : null}
                <button
                  type="button"
                  className="v-btn"
                  onClick={() => {
                    setMediaMode('featured');
                    setMediaOpen(true);
                  }}
                >
                  {t('blogs', 'setFeatured')}
                </button>
              </div>
            </div>
          ) : null}

          {boxes.categories ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'categories')}</h3>
              <div className="v-panel__b">
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {allCategories.map((c) => {
                    const name = c.translations?.[0]?.name ?? c.id;
                    return (
                      <li key={c.id}>
                        <label style={{ fontWeight: 400, display: 'flex', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={categoryIds.includes(c.id)}
                            onChange={() =>
                              setCategoryIds((prev) =>
                                prev.includes(c.id)
                                  ? prev.filter((x) => x !== c.id)
                                  : [...prev, c.id],
                              )
                            }
                          />
                          {name}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : null}

          {boxes.tags ? (
            <div className="v-panel">
              <h3 className="v-panel__h">{t('blogs', 'tags')}</h3>
              <div className="v-panel__b" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allTags.map((tg) => {
                  const name = tg.translations?.[0]?.name ?? tg.id;
                  const on = tagIds.includes(tg.id);
                  return (
                    <button
                      key={tg.id}
                      type="button"
                      className="v-btn"
                      style={on ? { background: '#2271b1', color: '#fff' } : undefined}
                      onClick={() =>
                        setTagIds((prev) =>
                          prev.includes(tg.id)
                            ? prev.filter((x) => x !== tg.id)
                            : [...prev, tg.id],
                        )
                      }
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {mediaOpen ? (
        <MediaLibrary
          mode={mediaMode === 'featured' ? 'select' : 'insert'}
          onClose={() => setMediaOpen(false)}
          onInsert={mediaMode === 'featured' ? setFeatured : insertMedia}
        />
      ) : null}
    </div>
  );
}
