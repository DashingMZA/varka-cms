'use client';

import { useEffect, useState } from 'react';

export function MediaSettings() {
  const [thumbnail, setThumbnail] = useState(150);
  const [medium, setMedium] = useState(300);
  const [large, setLarge] = useState(1024);
  const [organizeByYm, setOrganizeByYm] = useState(true);
  const [storageDriver, setStorageDriver] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/settings/media', { credentials: 'include' });
      if (!res.ok) return;
      const d = (await res.json()) as {
        thumbnail: number;
        medium: number;
        large: number;
        organizeByYm: boolean;
        storageDriver?: string;
      };
      setThumbnail(d.thumbnail);
      setMedium(d.medium);
      setLarge(d.large);
      setOrganizeByYm(d.organizeByYm);
      setStorageDriver(d.storageDriver ?? '');
    })();
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const res = await fetch('/api/settings/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ thumbnail, medium, large, organizeByYm, storageDriver }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(body.error ?? 'Save failed');
      setBusy(false);
      return;
    }
    setMsg('Media settings saved. New uploads use these sizes; existing files keep old derivatives.');
    setBusy(false);
  }

  return (
    <section className="v-panel">
      <h2 className="v-panel__h">Media — image sizes & folders</h2>
      <div className="v-panel__b">
        <p className="v-muted" style={{ marginTop: 0 }}>
          <strong>Original</strong> files are never resized. Thumbnail / medium / large are WebP
          derivatives (max width in px), like WordPress.
        </p>
        <div style={{ display: 'grid', gap: 10, maxWidth: 320 }}>
          <label style={{ fontWeight: 600 }}>
            Thumbnail max width
            <input
              type="number"
              value={thumbnail}
              onChange={(e) => setThumbnail(Number(e.target.value))}
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label style={{ fontWeight: 600 }}>
            Medium max width
            <input
              type="number"
              value={medium}
              onChange={(e) => setMedium(Number(e.target.value))}
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label style={{ fontWeight: 600 }}>
            Large max width
            <input
              type="number"
              value={large}
              onChange={(e) => setLarge(Number(e.target.value))}
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={organizeByYm}
              onChange={(e) => setOrganizeByYm(e.target.checked)}
            />
            Organize uploads into year/month folders (uploads/YYYY/MM/…)
          </label>
          <label style={{ fontWeight: 600 }}>
            Storage driver
            <select
              value={storageDriver}
              onChange={(e) => setStorageDriver(e.target.value)}
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
            >
              <option value="">Use STORAGE_DRIVER from .env</option>
              <option value="local">Local folder (public/uploads)</option>
              <option value="s3">Amazon S3</option>
              <option value="r2">Cloudflare R2</option>
              <option value="github">GitHub repo (small sites only)</option>
            </select>
          </label>
          <p className="v-muted" style={{ margin: 0, fontSize: 12 }}>
            Credentials stay in .env (S3_* / R2_*). This only picks which driver is
            active — it overrides STORAGE_DRIVER without a redeploy.
          </p>
        </div>
        {msg ? <div className="v-alert v-alert--ok">{msg}</div> : null}
        {err ? <div className="v-alert v-alert--error">{err}</div> : null}
        <button type="button" className="v-btn v-btn--primary" disabled={busy} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save media settings'}
        </button>
      </div>
    </section>
  );
}
