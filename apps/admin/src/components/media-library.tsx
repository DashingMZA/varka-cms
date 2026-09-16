'use client';

import { useCallback, useEffect, useState } from 'react';

type Asset = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  alt: string | null;
  key: string;
  storage: string;
  createdAt: string;
};

function previewUrl(a: Asset): string | null {
  if (a.storage === 'local') return `/api/media/file/${a.key}`;
  return null;
}

export function MediaLibrary() {
  const [items, setItems] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/media', { credentials: 'include' });
    if (!res.ok) {
      setError(`Load failed (${res.status})`);
      return;
    }
    const data = (await res.json()) as { items: Asset[] };
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('title', file.name);
      const res = await fetch('/api/media', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Upload failed (${res.status})`);
        setUploading(false);
        return;
      }
      await load();
    } catch {
      setError('Network error');
    }
    setUploading(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this asset?')) return;
    const res = await fetch(`/api/media/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      setError(`Delete failed (${res.status})`);
      return;
    }
    await load();
  }

  return (
    <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: 600,
          width: 'fit-content',
          cursor: 'pointer',
        }}
      >
        {uploading ? 'Uploading…' : 'Upload file'}
        <input
          type="file"
          hidden
          disabled={uploading}
          accept="image/*,application/pdf,video/mp4,audio/mpeg"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No media yet.</p>
        ) : (
          items.map((a) => {
            const url = previewUrl(a);
            const isImage = a.mimeType.startsWith('image/');
            return (
              <div
                key={a.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 12,
                  display: 'grid',
                  gap: 6,
                }}
              >
                {isImage && url ? (
                  <img
                    src={url}
                    alt={a.alt ?? a.filename}
                    style={{
                      width: '100%',
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                ) : null}
                <div style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>
                  {a.filename}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {a.mimeType} · {(a.sizeBytes / 1024).toFixed(1)} KB · {a.storage}
                </div>
                <button
                  type="button"
                  onClick={() => void remove(a.id)}
                  style={{
                    marginTop: 4,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: '#fff',
                    color: 'var(--danger)',
                    fontSize: 12,
                  }}
                >
                  Delete
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
