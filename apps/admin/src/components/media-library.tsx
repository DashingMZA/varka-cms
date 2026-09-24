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
  /** Compatibility alias used by post-editor */
  mode?: 'insert' | 'select' | 'browse';
};

function previewUrl(a: MediaAsset, size: MediaSizeKey = 'thumbnail'): string {
  const k = a.sizes?.[size]?.key ?? a.sizes?.medium?.key ?? a.key;
  return `/api/media/file/${k}`;
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
    if (imagesOnly) {
      list = list.filter((a) => a.mimeType.startsWith('image/'));
    }
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
      <div className="v-media__toolbar" style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <label className="v-btn v-btn--primary" style={{ cursor: 'pointer' }}>
          {uploading ? (t('common', 'loading') || 'Uploading…') : (t('media', 'upload') || 'Upload')}
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
        {onClose ? (
          <button type="button" className="v-btn" onClick={onClose}>
            {t('common', 'close') || 'Close'}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 280px' : '1fr', gap: 16 }}>
        <div
          className="v-media__grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 10,
          }}
        >
          {items.length === 0 ? (
            <p className="v-muted">{t('media', 'empty') || 'No media yet. Upload files to get started.'}</p>
          ) : (
            items.map((a) => {
              const isImg = a.mimeType.startsWith('image/');
              const active = a.id === selectedId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  style={{
                    border: active ? '2px solid #2271b1' : '1px solid #c3c4c7',
                    borderRadius: 4,
                    padding: 4,
                    background: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {isImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl(a, 'thumbnail')}
                      alt={a.alt || a.filename}
                      style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 90,
                        display: 'grid',
                        placeItems: 'center',
                        background: '#f0f0f1',
                        fontSize: 11,
                      }}
                    >
                      {a.mimeType}
                    </div>
                  )}
                  <div style={{ fontSize: 11, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.title || a.filename}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selected ? (
          <aside className="v-panel" style={{ alignSelf: 'start' }}>
            <h3 className="v-panel__h">{t('media', 'attachmentDetails') || 'Attachment details'}</h3>
            <div className="v-panel__b" style={{ display: 'grid', gap: 8 }}>
              {selected.mimeType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl(selected, 'medium')}
                  alt={selected.alt || ''}
                  style={{ maxWidth: '100%', borderRadius: 3 }}
                />
              ) : null}
              <p className="v-muted" style={{ margin: 0, fontSize: 12 }}>
                {selected.filename} · {formatBytes(selected.sizeBytes)}
                {selected.width && selected.height
                  ? ` · ${selected.width}×${selected.height}`
                  : ''}
              </p>
              <label style={{ fontSize: 12 }}>
                {t('media', 'title') || 'Title'}
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>
                {t('media', 'alt') || 'Alt text'}
                <input value={alt} onChange={(e) => setAlt(e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>
                {t('media', 'caption') || 'Caption'}
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} />
              </label>
              <label style={{ fontSize: 12 }}>
                {t('media', 'keywords') || 'Keywords'}
                <input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              </label>
              <div className="v-btn-row">
                <button type="button" className="v-btn" disabled={saving} onClick={() => void saveMeta()}>
                  {saving ? (t('common', 'saving') || 'Saving…') : (t('common', 'save') || 'Save')}
                </button>
                <button type="button" className="v-btn" style={{ color: 'var(--wp-danger)' }} onClick={() => void removeSelected()}>
                  {t('common', 'delete') || 'Delete'}
                </button>
              </div>

              {onInsert ? (
                <div style={{ borderTop: '1px solid #dcdcde', paddingTop: 10, marginTop: 4 }}>
                  <label style={{ fontSize: 12 }}>
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
                  <button
                    type="button"
                    className="v-btn v-btn--primary"
                    style={{ marginTop: 8 }}
                    onClick={insertSelected}
                  >
                    {t('media', 'insertIntoPost') || 'Insert into post'}
                  </button>
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );

  if (onClose || onInsert) {
    return (
      <div
        className="v-media-modal"
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 100000,
          display: 'grid',
          placeItems: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 4,
            maxWidth: 960,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>{t('media', 'library') || 'Media Library'}</strong>
            {onClose ? (
              <button type="button" className="v-btn" onClick={onClose}>
                ×
              </button>
            ) : null}
          </div>
          {body}
        </div>
      </div>
    );
  }

  return body;
}
