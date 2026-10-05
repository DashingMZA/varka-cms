'use client';

import { useRef, useState } from 'react';
import { installPluginAction } from '@/actions/plugins';

/** WordPress-style Add Plugin: upload a .zip file. */
export function PluginUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function onInstall(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setNotice({ kind: 'error', text: 'Please choose a .zip file.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append('pluginZip', file);
      const result = await installPluginAction(formData);
      if (result.ok) {
        setNotice({ kind: 'ok', text: 'Plugin installed successfully.' });
        if (fileRef.current) fileRef.current.value = '';
      } else {
        setNotice({ kind: 'error', text: result.error || 'Install failed' });
      }
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Install failed' });
    }
    setBusy(false);
  }

  return (
    <div>
      {notice ? (
        <div className={`v-notice v-notice--${notice.kind === 'ok' ? 'success' : 'error'}`}>
          {notice.text}
        </div>
      ) : null}
      <section className="v-card">
        <h2>Upload Plugin</h2>
        <p className="v-muted">
          Upload a plugin .zip file — like WordPress. The ZIP must contain a plugin.json manifest at its root.
        </p>
        <form onSubmit={onInstall} className="v-plugins-upload-form">
          <input ref={fileRef} type="file" accept=".zip,application/zip" disabled={busy} />
          <button type="submit" className="v-btn v-btn--primary" disabled={busy}>
            {busy ? 'Installing…' : 'Install Plugin'}
          </button>
        </form>
      </section>
    </div>
  );
}
