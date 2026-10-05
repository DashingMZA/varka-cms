'use client';

import {
  listPluginsAction,
  installPluginAction,
  activatePluginAction,
  deactivatePluginAction,
  deletePluginAction,
  type PluginListItem,
} from '@/actions/plugins';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

/** WordPress-style plugin management: install from ZIP, activate, delete. */
export function PluginsAdmin() {
  const [plugins, setPlugins] = useState<PluginListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await listPluginsAction();
    if (r.ok) setPlugins(r.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function done(kind: 'ok' | 'err', text: string) {
    setNotice({ kind, text });
    refresh();
  }

  async function onInstall(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setNotice({ kind: 'err', text: 'Choose a plugin ZIP file first.' });
      return;
    }
    setBusy('install');
    setNotice(null);
    try {
      const fd = new FormData();
      fd.set('pluginZip', file);
      const r = await installPluginAction(fd);
      if (r.ok) {
        done('ok', r.data.replaced ? `Updated "${r.data.name}".` : `Installed "${r.data.name}".`);
        if (fileRef.current) fileRef.current.value = '';
      } else {
        setNotice({ kind: 'err', text: r.error });
      }
    } finally {
      setBusy(null);
    }
  }

  async function onToggle(p: PluginListItem) {
    setBusy(p.slug);
    const r = p.active
      ? await deactivatePluginAction(p.slug)
      : await activatePluginAction(p.slug);
    if (!r.ok) setNotice({ kind: 'err', text: r.error });
    else refresh();
    setBusy(null);
  }

  async function onSync() {
    setBusy('sync');
    setNotice(null);
    try {
      const res = await fetch('/api/system/sync-plugins', { method: 'POST' });
      const data = (await res.json()) as { ok: boolean; error?: string; granted?: string };
      if (!data.ok) {
        setNotice({ kind: 'err', text: data.error ?? 'Sync failed' });
      } else {
        setNotice({
          kind: 'ok',
          text: `Plugin system ready. ${data.granted ?? ''} Refreshing…`,
        });
        refresh();
      }
    } catch {
      setNotice({ kind: 'err', text: 'Sync failed' });
    }
    setBusy(null);
  }

  async function onDelete(p: PluginListItem) {
    if (!window.confirm(`Delete plugin "${p.name}"? Its files will be removed.`)) return;
    setBusy(p.slug);
    const r = await deletePluginAction(p.slug);
    if (!r.ok) setNotice({ kind: 'err', text: r.error });
    else refresh();
    setBusy(null);
  }

  return (
    <main className="v-plugins">
      <h1 className="v-admin-title">Plugins</h1>

      {notice ? (
        <div className={`v-notice v-notice--${notice.kind === 'ok' ? 'success' : 'error'}`}>
          {notice.text}
        </div>
      ) : null}

      <section className="v-card v-plugins-upload">
        <h2>Add New Plugin</h2>
        <p className="v-muted">
          Upload a plugin <code>.zip</code> file — like WordPress. The ZIP must contain a{' '}
          <code>plugin.json</code> manifest at its root.
        </p>
        <form onSubmit={onInstall} className="v-plugins-upload-form">
          <input ref={fileRef} type="file" accept=".zip,application/zip" disabled={busy === 'install'} />
          <button type="submit" className="v-btn v-btn--primary" disabled={busy === 'install'}>
            {busy === 'install' ? 'Installing…' : 'Install Plugin'}
          </button>
        </form>
        <p className="v-muted" style={{ marginTop: 12 }}>
          First time here?{' '}
          <button
            type="button"
            className="v-btn v-btn--secondary"
            disabled={busy === 'sync'}
            onClick={() => void onSync()}
          >
            {busy === 'sync' ? 'Setting up…' : 'Initialize plugin system'}
          </button>{' '}
          Creates the database table and grants plugin permissions to Owner/Admin roles.
        </p>
      </section>

      <section className="v-card">
        <h2>Installed Plugins ({plugins.length})</h2>
        {loading ? (
          <p className="v-muted">Loading…</p>
        ) : plugins.length === 0 ? (
          <p className="v-muted">No plugins installed yet. Upload a ZIP above to add one.</p>
        ) : (
          <table className="v-table">
            <thead>
              <tr>
                <th>Plugin</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plugins.map((p) => (
                <tr key={p.slug} className={p.active ? 'v-plugin--active' : ''}>
                  <td>
                    <strong>{p.name}</strong>
                    <div className="v-muted v-small">
                      v{p.version}
                      {p.author ? ` by ${p.author}` : ''}
                    </div>
                    {!p.hasFiles ? (
                      <div className="v-notice v-notice--error v-small">
                        Files missing (e.g. ephemeral disk). Re-install the ZIP.
                      </div>
                    ) : null}
                  </td>
                  <td className="v-muted">{p.description || '—'}</td>
                  <td>{p.active ? 'Active' : 'Inactive'}</td>
                  <td className="v-row-actions">
                    {p.hasFiles ? (
                      <button
                        className="v-btn v-btn--small"
                        disabled={busy === p.slug}
                        onClick={() => onToggle(p)}
                      >
                        {p.active ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : null}
                    {p.active && p.hasFiles && p.menuTitle ? (
                      <Link className="v-btn v-btn--small" href={`/plugins/${p.slug}`}>
                        Open
                      </Link>
                    ) : null}
                    <button
                      className="v-btn v-btn--small v-btn--danger"
                      disabled={busy === p.slug}
                      onClick={() => onDelete(p)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
