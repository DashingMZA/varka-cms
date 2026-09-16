'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Asset = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  alt: string | null;
  key: string;
  storage: string;
  createdAt: string;
  width?: number | null;
  height?: number | null;
};

function previewUrl(a: Asset): string {
  if (a.key.startsWith('http')) return a.key;
  return `/api/media/file/${a.key}`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(mime: string): 'image' | 'video' | 'audio' | 'pdf' | 'file' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  return 'file';
}

function kindLabel(k: ReturnType<typeof fileKind>): string {
  switch (k) {
    case 'image':
      return 'Image';
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'pdf':
      return 'PDF';
    default:
      return 'File';
  }
}

export function MediaLibrary() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'pdf' | 'file'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

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

  async function uploadFiles(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
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
          break;
        }
      }
      await load();
    } catch {
      setError('Network error');
    }
    setUploading(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this file permanently?')) return;
    const res = await fetch(`/api/media/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      setError(`Delete failed (${res.status})`);
      return;
    }
    if (selected === id) setSelected(null);
    await load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((a) => {
      const kind = fileKind(a.mimeType);
      if (filter !== 'all' && kind !== filter) return false;
      if (!q) return true;
      return (
        a.filename.toLowerCase().includes(q) ||
        (a.alt ?? '').toLowerCase().includes(q) ||
        a.mimeType.toLowerCase().includes(q)
      );
    });
  }, [items, search, filter]);

  const selectedAsset = selected ? items.find((x) => x.id === selected) ?? null : null;

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Media</h1>
        <button
          type="button"
          className="v-btn v-btn--primary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Add New'}
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          disabled={uploading}
          accept="image/*,application/pdf,video/*,audio/*"
          onChange={(e) => {
            void uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <p className="v-page-desc">
        Upload and manage images and files. Use them as featured images or in post content.
      </p>

      {/* Drop zone */}
      <div
        className={`v-media-drop${dragOver ? ' is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <strong>Drop files to upload</strong>
        <span className="v-muted"> or click to browse · images, PDF, video, audio</span>
      </div>

      {error ? (
        <div className="v-alert v-alert--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="v-tablenav">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          aria-label="Filter by type"
        >
          <option value="all">All media</option>
          <option value="image">Images</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="pdf">PDF</option>
          <option value="file">Other</option>
        </select>
        <input
          type="search"
          placeholder="Search media…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 180 }}
        />
        <span className="v-muted" style={{ marginLeft: 4 }}>
          {filtered.length} item{filtered.length === 1 ? '' : 's'}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            type="button"
            className={`v-btn${view === 'grid' ? ' v-btn--primary' : ''}`}
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
          >
            Grid
          </button>
          <button
            type="button"
            className={`v-btn${view === 'list' ? ' v-btn--primary' : ''}`}
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
          >
            List
          </button>
        </span>
      </div>

      <div className="v-media-layout">
        <div className="v-media-main">
          {filtered.length === 0 ? (
            <p className="v-muted" style={{ padding: 24 }}>
              No media found.
            </p>
          ) : view === 'grid' ? (
            <div className="v-media-grid">
              {filtered.map((a) => {
                const kind = fileKind(a.mimeType);
                const isImage = kind === 'image';
                const isSelected = selected === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`v-media-card${isSelected ? ' is-selected' : ''}`}
                    onClick={() => setSelected(a.id)}
                    title={a.filename}
                  >
                    <div className="v-media-card__thumb">
                      {isImage ? (
                        <img src={previewUrl(a)} alt={a.alt ?? a.filename} loading="lazy" />
                      ) : (
                        <span className="v-media-card__icon" data-kind={kind}>
                          {kindLabel(kind)}
                        </span>
                      )}
                    </div>
                    <div className="v-media-card__meta">
                      <span className="v-media-card__name">{a.filename}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="v-table-wrap">
              <table className="v-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }} />
                    <th>File</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const kind = fileKind(a.mimeType);
                    return (
                      <tr
                        key={a.id}
                        className={selected === a.id ? 'is-selected-row' : undefined}
                        onClick={() => setSelected(a.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          {kind === 'image' ? (
                            <img
                              src={previewUrl(a)}
                              alt=""
                              width={36}
                              height={36}
                              style={{
                                width: 36,
                                height: 36,
                                objectFit: 'cover',
                                borderRadius: 3,
                                border: '1px solid var(--wp-border)',
                              }}
                            />
                          ) : (
                            <span className="v-badge">{kindLabel(kind)}</span>
                          )}
                        </td>
                        <td className="row-title">{a.filename}</td>
                        <td className="v-muted">{a.mimeType}</td>
                        <td className="v-muted">{formatBytes(a.sizeBytes)}</td>
                        <td className="v-muted">{new Date(a.createdAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="v-media-detail">
          {selectedAsset ? (
            <>
              <h2 className="v-panel__h" style={{ borderRadius: 'var(--wp-radius) var(--wp-radius) 0 0' }}>
                Attachment details
              </h2>
              <div className="v-panel__b">
                {fileKind(selectedAsset.mimeType) === 'image' ? (
                  <img
                    src={previewUrl(selectedAsset)}
                    alt={selectedAsset.alt ?? selectedAsset.filename}
                    style={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'contain',
                      background: '#f0f0f1',
                      borderRadius: 4,
                      marginBottom: 10,
                    }}
                  />
                ) : null}
                <p style={{ margin: '0 0 6px', fontWeight: 600, wordBreak: 'break-all' }}>
                  {selectedAsset.filename}
                </p>
                <dl className="v-media-dl">
                  <div>
                    <dt>Type</dt>
                    <dd>{selectedAsset.mimeType}</dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd>{formatBytes(selectedAsset.sizeBytes)}</dd>
                  </div>
                  <div>
                    <dt>Storage</dt>
                    <dd>{selectedAsset.storage}</dd>
                  </div>
                  <div>
                    <dt>Uploaded</dt>
                    <dd>{new Date(selectedAsset.createdAt).toLocaleString()}</dd>
                  </div>
                  {selectedAsset.width && selectedAsset.height ? (
                    <div>
                      <dt>Dimensions</dt>
                      <dd>
                        {selectedAsset.width} × {selectedAsset.height}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>URL</dt>
                    <dd>
                      <code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                        {previewUrl(selectedAsset)}
                      </code>
                    </dd>
                  </div>
                </dl>
                <div className="v-btn-row">
                  <a
                    className="v-btn"
                    href={previewUrl(selectedAsset)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    className="v-btn v-btn--danger"
                    onClick={() => void remove(selectedAsset.id)}
                  >
                    Delete permanently
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="v-panel__b">
              <p className="v-muted" style={{ margin: 0 }}>
                Select an item to see details.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
