'use client';

import { useRef, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { uploadMediaAction } from '@/actions/media';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'media' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('media', key);
  if (!v || v === key || v.startsWith('media.')) return fallback;
  return v;
}

export type FeaturedMedia = {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  storage: string;
  alt?: string | null;
};

function mediaUrl(a: FeaturedMedia): string {
  // Local uploads live in apps/admin/public/uploads, served statically at /uploads
  if (a.storage === 'local') return `/uploads/${a.key}`;
  return a.key.startsWith('http') ? a.key : `/uploads/${a.key}`;
}

type Props = {
  value: FeaturedMedia | null;
  library: FeaturedMedia[];
  onChange: (asset: FeaturedMedia | null) => void;
  onLibraryAdd: (asset: FeaturedMedia) => void;
};

/**
 * WordPress-style Featured Image:
 * - Upload from computer (post editor)
 * - Choose from Media Library grid
 * - Remove / replace
 */
export function FeaturedImagePanel({ value, library, onChange, onLibraryAdd }: Props) {
  const { t } = useMessages();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function uploadFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr(L(t, 'chooseImage', 'Please choose an image file'));
      return;
    }
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('title', file.name);
      const result = await uploadMediaAction(fd);
      if (!result.ok) {
        setErr(
          result.error ??
            L(t, 'uploadFailed', 'Upload failed'),
        );
        setUploading(false);
        return;
      }
      const data = result.data as FeaturedMedia & { asset?: FeaturedMedia };
      const asset = data.asset ?? data;
      if (!asset?.id) {
        setErr(L(t, 'noAssetId', 'Upload succeeded but no asset id returned'));
        setUploading(false);
        return;
      }
      onLibraryAdd(asset);
      onChange(asset);
      setOpen(false);
    } catch {
      setErr(L(t, 'networkError', 'Network error'));
    }
    setUploading(false);
  }

  return (
    <section className="v-panel">
      <h2 className="v-panel__h">{L(t, 'featuredImage', 'Featured image')}</h2>
      <div className="v-panel__b">
        {value ? (
          <div style={{ marginBottom: 8 }}>
            <img
              src={mediaUrl(value)}
              alt={value.alt ?? value.filename}
              style={{
                width: '100%',
                maxHeight: 160,
                objectFit: 'cover',
                borderRadius: 4,
                border: '1px solid var(--wp-border)',
                display: 'block',
              }}
            />
            <p className="v-muted" style={{ fontSize: 11, margin: '6px 0 0' }}>
              {value.filename}
            </p>
          </div>
        ) : (
          <p className="v-muted" style={{ marginTop: 0 }}>
            {L(t, 'noFeaturedImage', 'No featured image set.')}
          </p>
        )}

        {err ? (
          <p className="v-alert v-alert--error" style={{ fontSize: 12 }}>
            {err}
          </p>
        ) : null}

        <div className="v-btn-row" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className="v-btn v-btn--primary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading
              ? L(t, 'uploading', 'Uploading…')
              : value
                ? L(t, 'uploadReplace', 'Upload & replace')
                : L(t, 'uploadImage', 'Upload image')}
          </button>
          <button type="button" className="v-btn" onClick={() => setOpen(true)}>
            {L(t, 'mediaLibrary', 'Media library')}
          </button>
          {value ? (
            <button type="button" className="v-btn v-btn--danger" onClick={() => onChange(null)}>
              {L(t, 'remove', 'Remove')}
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void uploadFile(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />

        {open ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={L(t, 'mediaLibrary', 'Media library')}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 1000,
              display: 'grid',
              placeItems: 'center',
              padding: 16,
            }}
            onClick={() => setOpen(false)}
          >
            <div
              className="v-panel"
              style={{ width: 'min(640px, 100%)', maxHeight: '80vh', margin: 0, display: 'flex', flexDirection: 'column' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="v-panel__h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{L(t, 'selectFeatured', 'Select featured image')}</span>
                <button type="button" className="v-btn" onClick={() => setOpen(false)}>
                  {L(t, 'close', 'Close')}
                </button>
              </div>
              <div className="v-panel__b" style={{ overflow: 'auto' }}>
                <div className="v-btn-row">
                  <button
                    type="button"
                    className="v-btn v-btn--primary"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                  >
                    {uploading ? L(t, 'uploading', 'Uploading…') : L(t, 'uploadNew', 'Upload new')}
                  </button>
                </div>
                {library.length === 0 ? (
                  <p className="v-muted">{L(t, 'noImages', 'No images in library yet. Upload one.')}</p>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {library.map((m) => {
                      const selected = value?.id === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            onChange(m);
                            setOpen(false);
                          }}
                          style={{
                            padding: 0,
                            border: selected ? '2px solid var(--wp-accent)' : '1px solid var(--wp-border)',
                            borderRadius: 4,
                            overflow: 'hidden',
                            background: '#fff',
                            cursor: 'pointer',
                          }}
                          title={m.filename}
                        >
                          <img
                            src={mediaUrl(m)}
                            alt={m.alt ?? m.filename}
                            style={{ width: '100%', height: 88, objectFit: 'cover', display: 'block' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
