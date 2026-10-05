'use client';

import {
  listMediaAction,
  deleteMediaAction,
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

const SIZE_LABELS: { key: MediaSizeKey; label: string }[] = [
  { key: 'thumbnail', label: 'Thumbnail' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' },
  { key: 'original', label: 'Full size' },
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

  const selected = useMemo(
    () => items.find((a) => a.id === selectedId) ?? null,
    [items, selectedId],
  );

  const load = useCallback(async () => {
    const result = await listMediaAction(100);
    if (!result.ok) {
      setError(`Load failed: ${result.error}`);
      return;
    }
    let list = (result.data.items as MediaAsset[]) ?? [];
    if (imagesOnly) list = list.filter((a) => a.mimeType.startsWith('image/'));
    setItems(list);
  }, [imagesOnly]);

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
    if (!confirm('Delete this media file?')) return;
    const result = await deleteMediaAction(selected.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelectedId(null);
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
        {error ? (
          <span className="v-muted" style={{ color: 'var(--wp-danger)' }}>
            {error}
          </span>
        ) : null}
      </div>

      <div className="v-media__layout">
        <div className="v-media__grid">
          {items.length === 0 ? (
            <p className="v-muted" style={{ gridColumn: '1 / -1' }}>
              {t('media', 'empty') || 'No media yet. Upload files to get started.'}
            </p>
          ) : (
            items.map((a) => {
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
                      {SIZE_LABELS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
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
