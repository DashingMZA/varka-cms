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
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'plugins' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('plugins', key);
  if (!v || v === key || v.startsWith('plugins.')) return fallback;
  return v;
}

/** WordPress-style plugin management: install from ZIP, activate, delete. */
export function PluginsAdmin() {
  const { t } = useMessages();
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
      setNotice({ kind: 'err', text: L(t, 'chooseFile', 'Choose a plugin ZIP file first.') });
      return;
    }
    setBusy('install');
    setNotice(null);
    try {
      const fd = new FormData();
      fd.set('pluginZip', file);
      const r = await installPluginAction(fd);
      if (r.ok) {
        const msg = r.data.replaced
          ? L(t, 'updated', 'Updated "{name}".').replace('{name}', r.data.name)
          : L(t, 'installed', 'Installed "{name}".').replace('{name}', r.data.name);
        done('ok', msg);
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

  async function onDelete(p: PluginListItem) {
    const confirmMsg = L(t, 'deleteConfirm', 'Delete plugin "{name}"? Its files will be removed.').replace('{name}', p.name);
    if (!window.confirm(confirmMsg)) return;
    setBusy(p.slug);
    const r = await deletePluginAction(p.slug);
    if (!r.ok) setNotice({ kind: 'err', text: r.error });
    else refresh();
    setBusy(null);
  }

  return (
    <main className="v-plugins">
      <h1 className="v-admin-title">{L(t, 'plugins', 'Plugins')}</h1>

      {notice ? (
        <div className={`v-notice v-notice--${notice.kind === 'ok' ? 'success' : 'error'}`}>
          {notice.text}
        </div>
      ) : null}

      <section className="v-card v-plugins-upload">
        <h2>{L(t, 'addNew', 'Add New Plugin')}</h2>
        <p className="v-muted">
          {L(t, 'uploadHelp', 'Upload a plugin .zip file — like WordPress. The ZIP must contain a plugin.json manifest at its root.')}
        </p>
        <form onSubmit={onInstall} className="v-plugins-upload-form">
          <input ref={fileRef} type="file" accept=".zip,application/zip" disabled={busy === 'install'} />
          <button type="submit" className="v-btn v-btn--primary" disabled={busy === 'install'}>
            {busy === 'install' ? L(t, 'installing', 'Installing…') : L(t, 'install', 'Install Plugin')}
          </button>
        </form>
      </section>

      <section className="v-card">
        <h2>{L(t, 'installedPlugins', 'Installed Plugins')} ({plugins.length})</h2>
        {loading ? (
          <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>
        ) : plugins.length === 0 ? (
          <p className="v-muted">{L(t, 'noPlugins', 'No plugins installed yet. Upload a ZIP above to add one.')}</p>
        ) : (
          <table className="v-table">
            <thead>
              <tr>
                <th>{L(t, 'plugin', 'Plugin')}</th>
                <th>{L(t, 'description', 'Description')}</th>
                <th>{L(t, 'status', 'Status')}</th>
                <th>{L(t, 'actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {plugins.map((p) => (
                <tr key={p.slug} className={p.active ? 'v-plugin--active' : ''}>
                  <td>
                    <strong>{p.name}</strong>
                    <div className="v-muted v-small">
                      v{p.version}
                      {p.author ? ` ${L(t, 'by', 'by')} ${p.author}` : ''}
                    </div>
                    {!p.hasFiles ? (
                      <div className="v-notice v-notice--error v-small">
                        {L(t, 'filesMissing', 'Files missing (e.g. ephemeral disk). Re-install the ZIP.')}
                      </div>
                    ) : null}
                  </td>
                  <td className="v-muted">{p.description || '—'}</td>
                  <td>{p.active ? L(t, 'active', 'Active') : L(t, 'inactive', 'Inactive')}</td>
                  <td className="v-row-actions">
                    {p.hasFiles ? (
                      <button
                        className="v-btn v-btn--small"
                        disabled={busy === p.slug}
                        onClick={() => onToggle(p)}
                      >
                        {p.active ? L(t, 'deactivate', 'Deactivate') : L(t, 'activate', 'Activate')}
                      </button>
                    ) : null}
                    {p.active && p.hasFiles && p.menuTitle ? (
                      <Link className="v-btn v-btn--small" href={`/plugins/${p.slug}`}>
                        {L(t, 'open', 'Open')}
                      </Link>
                    ) : null}
                    <button
                      className="v-btn v-btn--small v-btn--danger"
                      disabled={busy === p.slug}
                      onClick={() => onDelete(p)}
                    >
                      {L(t, 'delete', 'Delete')}
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
