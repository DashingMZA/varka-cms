'use client';

import { useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { listMediaAction } from '@/actions/media';

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

type SizeMeta = {
  key: string;
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
};

type Asset = {
  id: string;
  filename: string;
  mimeType: string;
  key: string;
  alt: string | null;
  title?: string | null;
  caption?: string | null;
  sizes?: Record<string, SizeMeta> | null;
};

export type InsertImageResult = {
  src: string;
  alt: string;
  title?: string;
  size: string;
  width?: number;
  height?: number;
};

function urlForKey(key: string) {
  if (key.startsWith('http')) return key;
  return `/uploads/${key}`;
}

export function InsertImageModal({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (r: InsertImageResult) => void;
}) {
  const [items, setItems] = useState<Asset[]>([]);
  const [selected, setSelected] = useState<Asset | null>(null);
  const { t } = useMessages();
  const [size, setSize] = useState<string>('medium');

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const result = await listMediaAction({ limit: 60 });
      if (!result.ok) return;
      const items = (result.data.items as Asset[]) ?? [];
      setItems(items.filter((x) => x.mimeType.startsWith('image/')));
    })();
  }, [open]);

  if (!open) return null;

  function availableSizes(a: Asset): string[] {
    const keys = a.sizes ? Object.keys(a.sizes) : [];
    if (keys.length === 0) return ['original'];
    const order = ['thumbnail', 'medium', 'large', 'original', 'full'];
    return order.filter((k) => keys.includes(k)).concat(keys.filter((k) => !order.includes(k)));
  }

  function insert() {
    if (!selected) return;
    const sizes = selected.sizes ?? {};
    const meta = sizes[size] ?? sizes.original ?? sizes.full;
    const key = meta?.key ?? selected.key;
    onInsert({
      src: urlForKey(key),
      alt: selected.alt ?? selected.title ?? selected.filename,
      title: selected.title ?? undefined,
      size,
      width: meta?.width,
      height: meta?.height,
    });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={L(t, 'insertImage', 'Insert image')}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="v-panel"
        style={{ width: 'min(720px, 100%)', maxHeight: '90vh', overflow: 'auto', margin: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="v-panel__h">{L(t, 'insertMedia', 'Insert media')}</h2>
        <div className="v-panel__b">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: 8,
              maxHeight: 280,
              overflow: 'auto',
              marginBottom: 12,
            }}
          >
            {items.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setSelected(a);
                  const sizes = availableSizes(a);
                  setSize(sizes.includes('medium') ? 'medium' : sizes[0] ?? 'original');
                }}
                style={{
                  border:
                    selected?.id === a.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 4,
                  padding: 0,
                  background: '#fff',
                  cursor: 'pointer',
                  aspectRatio: '1',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={urlForKey(a.sizes?.thumbnail?.key ?? a.key)}
                  alt={a.alt ?? a.filename}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>

          {selected ? (
            <>
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{selected.filename}</p>
              <label style={{ display: 'grid', gap: 4, fontWeight: 600, marginBottom: 12 }}>
                {L(t, 'size', 'Size')}
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  style={{ padding: 8, fontWeight: 400 }}
                >
                  {availableSizes(selected).map((s) => {
                    const m = selected.sizes?.[s];
                    const label = m ? `${s} (${m.width}×${m.height})` : s;
                    return (
                      <option key={s} value={s}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>
            </>
          ) : (
            <p className="v-muted">
              {L(t, 'selectImageHint', 'Select an image, then choose size (thumbnail / medium / large / original).')}
            </p>
          )}

          <div className="v-btn-row">
            <button type="button" className="v-btn v-btn--primary" disabled={!selected} onClick={insert}>
              {L(t, 'insertIntoPost', 'Insert into post')}
            </button>
            <button type="button" className="v-btn" onClick={onClose}>
              {t('common', 'cancel') || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
