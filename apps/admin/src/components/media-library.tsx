'use client';

import {
  listMediaAction,
  deleteMediaAction,
  bulkDeleteMediaAction,
  updateMediaAction,
  uploadMediaAction,
} from '@/actions/media';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMessages } from '@/lib/i18n';

export type MediaSizeKey = 'thumbnail' | 'medium' | 'large' | 'original';

export type MediaSizeInfo = {
  key: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
};

export type MediaAsset = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  alt: string | null;
  title: string | null;
  caption?: string | null;
  keywords?: string | null;
  key: string;
  storage: string;
  sizes?: Partial<Record<MediaSizeKey, MediaSizeInfo>> | null;
  createdAt: string;
};

export type MediaInsertPayload = {
  asset: MediaAsset;
  size: MediaSizeKey;
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type Props = {
  onInsert?: (payload: MediaInsertPayload) => void;
  onClose?: () => void;
  imagesOnly?: boolean;
  mode?: 'insert' | 'select' | 'browse';
};

function previewUrl(a: MediaAsset, size: MediaSizeKey = 'thumbnail'): string {
  const k = a.sizes?.[size]?.key ?? a.sizes?.medium?.key ?? a.key;
  return `/uploads/${k}`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const SIZE_KEYS: { key: MediaSizeKey; i18nKey: string; fallback: string }[] = [
  { key: 'thumbnail', i18nKey: 'thumbnail', fallback: 'Thumbnail' },
  { key: 'medium', i18nKey: 'medium', fallback: 'Medium' },
  { key: 'large', i18nKey: 'large', fallback: 'Large' },
  { key: 'original', i18nKey: 'fullSize', fallback: 'Full size' },
];

export function MediaLibrary({ onInsert, onClose, imagesOnly }: Props) {
  const { t } = useMessages();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [insertSize, setInsertSize] = useState<MediaSizeKey>('large');
  const [title, setTitle] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [keywords, setKeywords] = useState('');

  // WP-parity: view modes, filters, bulk selection
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [query, setQuery] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const selected = useMemo(
    () => items.find((a) => a.id === selectedId) ?? null,
    [items, selectedId],
  );

  const load = useCallback(async () => {
    const result = await listMediaAction({
      limit: 100,
      mimePrefix: typeFilter || undefined,
      month: monthFilter || undefined,
    });
    if (!result.ok) {
      setError(`Load failed: ${result.error}`);
      return;
    }
    let list = (result.data.items as MediaAsset[]) ?? [];
    if (imagesOnly) list = list.filter((a) => a.mimeType.startsWith('image/'));
    setItems(list);
    setChecked(new Set());
  }, [imagesOnly, typeFilter, monthFilter]);

  // Distinct YYYY-MM months present in the loaded items (for the date filter)
  const months = useMemo(() => {
    const set = new Map<string, string>();
    for (const a of items) {
      const d = new Date(a.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!set.has(key)) {
        set.set(
          key,
          d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }),
        );
      }
    }
    return Array.from(set.entries()).toSorted((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  // Client-side search across loaded items (filename / title)
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.filename.toLowerCase().includes(q) ||
        (a.title ?? '').toLowerCase().includes(q),
    );
  }, [items, query]);

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkDelete() {
    if (checked.size === 0) return;
    if (!confirm(`Delete ${checked.size} selected file(s) permanently?`)) return;
    setBulkDeleting(true);
    const result = await bulkDeleteMediaAction(Array.from(checked));
    setBulkDeleting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (selectedId && checked.has(selectedId)) setSelectedId(null);
    await load();
  }

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setTitle('');
      setAlt('');
      setCaption('');
      setKeywords('');
      return;
    }
    setTitle(selected.title ?? '');
    setAlt(selected.alt ?? '');
    setCaption(selected.caption ?? '');
    setKeywords(selected.keywords ?? '');
  }, [selected]);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set('file', file);
        const result = await uploadMediaAction(fd);
        if (!result.ok) {
          setError(result.error);
          break;
        }
      }
      await load();
    } catch {
      setError(t('errors', 'networkError') || 'Upload failed');
    }
    setUploading(false);
  }

  async function saveMeta() {
    if (!selected) return;
    setSaving(true);
    const result = await updateMediaAction(selected.id, {
      title: title || null,
      alt: alt || null,
      caption: caption || null,
      keywords: keywords || null,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
  }

  async function removeSelected() {
    if (!selected) return;
    await removeById(selected.id);
  }

  async function removeById(id: string) {
    if (!confirm(t('media', 'deleteConfirm') || 'Delete this media file permanently?')) return;
    const result = await deleteMediaAction(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (selectedId === id) setSelectedId(null);
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await load();
  }

  function insertSelected() {
    if (!selected || !onInsert) return;
    const src = previewUrl(selected, insertSize);
    const sizeInfo = selected.sizes?.[insertSize];
    onInsert({
      asset: selected,
      size: insertSize,
      src,
      alt: alt || selected.alt || '',
      width: sizeInfo?.width ?? selected.width ?? undefined,
      height: sizeInfo?.height ?? selected.height ?? undefined,
    });
  }

  const body = (
    <div className="v-media">
      <div className="v-media__toolbar">
        <label className="v-btn v-btn--primary" style={{ cursor: 'pointer' }}>
          {uploading ? (t('common', 'loading') || 'Uploading…') : (t('media', 'upload') || 'Upload files')}
          <input
            type="file"
            multiple
            accept={imagesOnly ? 'image/*' : undefined}
            style={{ display: 'none' }}
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files)}
          />
        </label>
        <button type="button" className="v-btn" onClick={() => void load()}>
          {t('common', 'refresh') || 'Refresh'}
        </button>
        {/* View toggle (WP: grid / list) */}
        <div className="v-btn-group" role="group" aria-label={t('media', 'view') || 'View'}>
          <button
            type="button"
            className={'v-btn v-btn--small' + (view === 'grid' ? ' v-btn--primary' : '')}
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
            title={t('media', 'gridView') || 'Grid view'}
          >
            ▦
          </button>
          <button
            type="button"
            className={'v-btn v-btn--small' + (view === 'list' ? ' v-btn--primary' : '')}
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            title={t('media', 'listView') || 'List view'}
          >
            ☰
          </button>
        </div>
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label={t('media', 'filterByType') || 'Filter by type'}
        >
          <option value="">{t('media', 'allTypes') || 'All media items'}</option>
          <option value="image/">{t('media', 'images') || 'Images'}</option>
          <option value="audio/">{t('media', 'audio') || 'Audio'}</option>
          <option value="video/">{t('media', 'video') || 'Video'}</option>
          <option value="application/">{t('media', 'documents') || 'Documents'}</option>
        </select>
        {/* Date filter */}
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          aria-label={t('media', 'filterByDate') || 'Filter by date'}
        >
          <option value="">{t('media', 'allDates') || 'All dates'}</option>
          {months.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {/* Search */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('media', 'searchMedia') || 'Search media'}
          aria-label={t('media', 'searchMedia') || 'Search media'}
          style={{ minWidth: 140 }}
        />
        {checked.size > 0 ? (
          <button
            type="button"
            className="v-btn v-btn--small"
            style={{ color: 'var(--wp-danger)' }}
            disabled={bulkDeleting}
            onClick={() => void bulkDelete()}
          >
            {bulkDeleting
              ? t('common', 'loading') || 'Deleting…'
              : `${t('common', 'delete') || 'Delete'} (${checked.size})`}
          </button>
        ) : null}
        {error ? (
          <span className="v-muted" style={{ color: 'var(--wp-danger)' }}>
            {error}
          </span>
        ) : null}
      </div>

      <div className="v-media__layout">
        {view === 'grid' ? (
          <div className="v-media__grid">
            {visible.length === 0 ? (
              <p className="v-muted" style={{ gridColumn: '1 / -1' }}>
                {t('media', 'empty') || 'No media yet. Upload files to get started.'}
              </p>
            ) : (
              visible.map((a) => {
                const isImg = a.mimeType.startsWith('image/');
                const active = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={'v-media__item' + (active ? ' is-selected' : '')}
                    onClick={() => setSelectedId(a.id)}
                  >
                    {isImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl(a, 'thumbnail')} alt={a.alt || a.filename} />
                    ) : (
                      <div
                        style={{
                          height: 120,
                          display: 'grid',
                          placeItems: 'center',
                          background: '#f0f0f1',
                          fontSize: 11,
                        }}
                      >
                        {a.mimeType}
                      </div>
                    )}
                    <div className="v-media__item-meta">{a.title || a.filename}</div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="v-media__list" style={{ flex: 1, minWidth: 0 }}>
            <table className="v-list-table">
              <thead>
                <tr>
                  <td className="check-column">
                    <input
                      type="checkbox"
                      checked={visible.length > 0 && checked.size === visible.length}
                      onChange={(e) =>
                        setChecked(e.target.checked ? new Set(visible.map((a) => a.id)) : new Set())
                      }
                      aria-label={t('common', 'selectAll') || 'Select all'}
                    />
                  </td>
                  <th>{t('media', 'file') || 'File'}</th>
                  <th>{t('media', 'title') || 'Title'}</th>
                  <th>{t('common', 'date') || 'Date'}</th>
                  <th>{t('media', 'size') || 'Size'}</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="v-muted">
                      {t('media', 'empty') || 'No media yet. Upload files to get started.'}
                    </td>
                  </tr>
                ) : (
                  visible.map((a) => {
                    const isImg = a.mimeType.startsWith('image/');
                    return (
                      <tr key={a.id} className={a.id === selectedId ? 'is-selected' : ''}>
                        <th className="check-column">
                          <input
                            type="checkbox"
                            checked={checked.has(a.id)}
                            onChange={() => toggleCheck(a.id)}
                            aria-label={a.filename}
                          />
                        </th>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedId(a.id)}
                            style={{
                              border: 0,
                              background: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'block',
                            }}
                          >
                            {isImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewUrl(a, 'thumbnail')}
                                alt={a.alt || a.filename}
                                style={{ width: 60, height: 60, objectFit: 'cover', display: 'block' }}
                              />
                            ) : (
                              <span className="v-muted" style={{ fontSize: 11 }}>
                                {a.mimeType}
                              </span>
                            )}
                          </button>
                        </td>
                        <td>
                          <strong>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedId(a.id);
                              }}
                              className="row-title"
                            >
                              {a.title || a.filename}
                            </a>
                          </strong>
                          <div className="v-muted" style={{ fontSize: 12 }}>
                            {a.filename}
                          </div>
                          <div className="row-actions">
                            <span>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedId(a.id);
                                }}
                              >
                                {t('common', 'edit') || 'Edit'}
                              </a>
                            </span>
                            {' | '}
                            <span>
                              <a href={`/uploads/${a.key}`} target="_blank" rel="noreferrer">
                                {t('media', 'view') || 'View'}
                              </a>
                            </span>
                            {' | '}
                            <span>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  void navigator.clipboard?.writeText(
                                    `${window.location.origin}/uploads/${a.key}`,
                                  ).catch(() => {});
                                }}
                              >
                                {t('media', 'copyUrl') || 'Copy URL'}
                              </a>
                            </span>
                            {' | '}
                            <a
                              href="#"
                              className="trash"
                              onClick={(e) => {
                                e.preventDefault();
                                void removeById(a.id);
                              }}
                            >
                              {t('common', 'delete') || 'Delete'}
                            </a>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatBytes(a.sizeBytes)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <aside className="v-media__sidebar">
          {selected ? (
            <>
              <h3>{t('media', 'attachmentDetails') || 'Attachment details'}</h3>
              {selected.mimeType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl(selected, 'medium')}
                  alt={selected.alt || ''}
                  style={{ maxWidth: '100%', marginBottom: 8, border: '1px solid #c3c4c7' }}
                />
              ) : null}
              <p className="v-muted" style={{ margin: '0 0 10px' }}>
                {selected.filename} · {formatBytes(selected.sizeBytes)}
                {selected.width && selected.height
                  ? ` · ${selected.width}×${selected.height}`
                  : ''}
              </p>
              <label>
                {t('media', 'title') || 'Title'}
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                {t('media', 'alt') || 'Alt text'}
                <input value={alt} onChange={(e) => setAlt(e.target.value)} />
              </label>
              <label>
                {t('media', 'caption') || 'Caption'}
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} />
              </label>
              <label>
                {t('media', 'keywords') || 'Keywords'}
                <input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              </label>
              <div className="v-btn-row">
                <button type="button" className="v-btn" disabled={saving} onClick={() => void saveMeta()}>
                  {saving ? (t('common', 'saving') || 'Saving…') : (t('common', 'save') || 'Save')}
                </button>
                <button
                  type="button"
                  className="v-btn"
                  style={{ color: 'var(--wp-danger)' }}
                  onClick={() => void removeSelected()}
                >
                  {t('common', 'delete') || 'Delete'}
                </button>
              </div>
              {onInsert ? (
                <div style={{ borderTop: '1px solid #dcdcde', paddingTop: 12, marginTop: 12 }}>
                  <label>
                    {t('media', 'size') || 'Size'}
                    <select
                      value={insertSize}
                      onChange={(e) => setInsertSize(e.target.value as MediaSizeKey)}
                    >
                      {SIZE_KEYS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {t('media', s.i18nKey) || s.fallback}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </>
          ) : (
            <p className="v-muted">{t('media', 'selectItem') || 'Select an item to view details.'}</p>
          )}
        </aside>
      </div>

      {onInsert ? (
        <div className="v-media-modal__footer">
          {onClose ? (
            <button type="button" className="v-btn" onClick={onClose}>
              {t('common', 'cancel') || 'Cancel'}
            </button>
          ) : null}
          <button
            type="button"
            className="v-btn v-btn--primary"
            disabled={!selected}
            onClick={insertSelected}
          >
            {t('media', 'insertIntoPost') || 'Insert into post'}
          </button>
        </div>
      ) : null}
    </div>
  );

  if (onClose || onInsert) {
    return (
      <div className="v-media-modal" role="dialog" aria-modal="true">
        <div className="v-media-modal__frame v-media-frame">
          <div className="v-media-modal__bar">
            <h2>{t('media', 'library') || 'Media Library'}</h2>
            {onClose ? (
              <button type="button" className="v-btn" onClick={onClose} aria-label="Close">
                ×
              </button>
            ) : null}
          </div>
          <div className="v-media-modal__body">{body}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="v-wrap">
      <div className="v-page-header">
        <h1 className="v-page-title">{t('media', 'library') || 'Media Library'}</h1>
      </div>
      <div
        className="v-media-frame"
        style={{ border: '1px solid #c3c4c7', boxShadow: '0 1px 1px rgba(0,0,0,0.04)' }}
      >
        {body}
      </div>
    </div>
  );
}
