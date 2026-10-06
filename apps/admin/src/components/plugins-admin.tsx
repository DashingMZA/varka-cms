'use client';

import {
  listPluginsAction,
  activatePluginAction,
  deactivatePluginAction,
  deletePluginAction,
  type PluginListItem,
} from '@/actions/plugins';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { Subsubsub } from '@/components/list-table/list-table';

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

/** WordPress-style plugin list: filters, search, bulk actions, row actions. */
export function PluginsAdmin() {
  const { t } = useMessages();
  const [plugins, setPlugins] = useState<PluginListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await listPluginsAction();
    if (r.ok) setPlugins(r.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onToggle(p: PluginListItem) {
    setBusy(p.slug);
    const r = p.active
      ? await deactivatePluginAction(p.slug)
      : await activatePluginAction(p.slug);
    if (!r.ok) setNotice({ kind: 'err', text: r.error });
    else {
      setNotice({
        kind: 'ok',
        text: p.active
          ? L(t, 'deactivated', 'Plugin deactivated.')
          : L(t, 'activated', 'Plugin activated.'),
      });
      refresh();
    }
    setBusy(null);
  }

  async function onDelete(p: PluginListItem) {
    const confirmMsg = L(t, 'deleteConfirm', 'Delete plugin "{name}"? Its files will be removed.').replace('{name}', p.name);
    if (!window.confirm(confirmMsg)) return;
    setBusy(p.slug);
    const r = await deletePluginAction(p.slug);
    if (!r.ok) setNotice({ kind: 'err', text: r.error });
    else {
      setNotice({ kind: 'ok', text: L(t, 'deleted', 'Plugin deleted.') });
      refresh();
    }
    setBusy(null);
  }

  async function applyBulk() {
    if (!bulkAction || selected.size === 0) return;
    if (bulkAction === 'delete') {
      if (!window.confirm(L(t, 'bulkDeleteConfirm', 'Delete selected plugins? Their files will be removed.'))) return;
    }
    setBusy('bulk');
    for (const slug of selected) {
      if (bulkAction === 'activate') await activatePluginAction(slug);
      else if (bulkAction === 'deactivate') await deactivatePluginAction(slug);
      else if (bulkAction === 'delete') await deletePluginAction(slug);
    }
    setSelected(new Set());
    setBulkAction('');
    setBusy(null);
    refresh();
  }

  // Filter by status and search
  const filtered = plugins.filter((p) => {
    if (statusFilter === 'active' && !p.active) return false;
    if (statusFilter === 'inactive' && p.active) return false;
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      return (
        p.name.toLowerCase().includes(needle) ||
        (p.description ?? '').toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle)
      );
    }
    return true;
  });

  const activeCount = plugins.filter((p) => p.active).length;
  const inactiveCount = plugins.length - activeCount;
  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{L(t, 'plugins', 'Plugins')}</h1>
        <Link href="/plugins/new" className="v-btn v-btn--primary">
          {L(t, 'addNew', 'Add New')}
        </Link>
      </div>

      {notice ? (
        <div className={`v-notice v-notice--${notice.kind === 'ok' ? 'success' : 'error'}`}>
          {notice.text}
        </div>
      ) : null}

      <Subsubsub
        active={statusFilter}
        onChange={(id) => {
          setStatusFilter(id);
          setSelected(new Set());
        }}
        items={[
          { id: 'all', label: `${L(t, 'all', 'All')} (${plugins.length})` },
          { id: 'active', label: `${L(t, 'active', 'Active')} (${activeCount})` },
          { id: 'inactive', label: `${L(t, 'inactive', 'Inactive')} (${inactiveCount})` },
        ]}
      />

      <div className="v-list-table-top">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
            <option value="">{L(t, 'bulkActions', 'Bulk actions')}</option>
            <option value="activate">{L(t, 'activate', 'Activate')}</option>
            <option value="deactivate">{L(t, 'deactivate', 'Deactivate')}</option>
            <option value="delete">{L(t, 'delete', 'Delete')}</option>
          </select>
          <button
            type="button"
            className="v-btn"
            onClick={() => void applyBulk()}
            disabled={!bulkAction || selected.size === 0 || busy === 'bulk'}
          >
            {L(t, 'apply', 'Apply')}
          </button>
          <span className="v-muted" style={{ marginInlineStart: 'auto' }}>
            {filtered.length} {L(t, 'items', 'items')}
          </span>
        </div>
        <div className="v-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L(t, 'searchPlugins', 'Search plugins…')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSelected(new Set());
            }}
          />
          <button type="button" className="v-btn" onClick={() => setSelected(new Set())}>
            {L(t, 'search', 'Search')}
          </button>
        </div>
      </div>

      <table className="v-list-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelected(new Set(filtered.map((p) => p.slug)));
                  } else {
                    setSelected(new Set());
                  }
                }}
                aria-label={L(t, 'selectAll', 'Select all')}
              />
            </th>
            <th>{L(t, 'plugin', 'Plugin')}</th>
            <th>{L(t, 'description', 'Description')}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={3} className="v-muted">
                {L(t, 'loading', 'Loading…')}
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={3} className="v-muted">
                {plugins.length === 0
                  ? L(t, 'noPlugins', 'No plugins installed yet.')
                  : L(t, 'noMatch', 'No plugins match your query.')}
              </td>
            </tr>
          ) : (
            filtered.map((p) => (
              <tr key={p.slug} className={p.active ? 'active' : 'inactive'}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(p.slug)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(p.slug);
                      else next.delete(p.slug);
                      setSelected(next);
                    }}
                    aria-label={p.name}
                  />
                </td>
                <td>
                  <strong className="row-title">{p.name}</strong>
                  <div className="row-actions">
                    <span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          void onToggle(p);
                        }}
                        className={p.active ? 'deactivate' : 'activate'}
                      >
                        {busy === p.slug
                          ? '…'
                          : p.active
                            ? L(t, 'deactivate', 'Deactivate')
                            : L(t, 'activate', 'Activate')}
                      </a>
                    </span>
                    {p.active && p.hasFiles && p.menuTitle ? (
                      <>
                        {' | '}
                        <span>
                          <Link href={`/plugins/${p.slug}`}>{L(t, 'open', 'Open')}</Link>
                        </span>
                      </>
                    ) : null}
                    {' | '}
                    <span>
                      <a
                        href="#"
                        className="trash"
                        onClick={(e) => {
                          e.preventDefault();
                          void onDelete(p);
                        }}
                      >
                        {L(t, 'delete', 'Delete')}
                      </a>
                    </span>
                  </div>
                  {!p.hasFiles ? (
                    <div className="v-notice v-notice--error" style={{ marginTop: 6, fontSize: 12 }}>
                      {L(t, 'filesMissing', 'Files missing (e.g. ephemeral disk). Re-install the ZIP.')}
                    </div>
                  ) : null}
                </td>
                <td>
                  <span className="v-muted">{p.description || '—'}</span>
                  <div className="v-muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {L(t, 'version', 'Version')} {p.version}
                    {p.author ? ` | ${L(t, 'by', 'By')} ${p.author}` : ''}
                    {p.active ? (
                      <span style={{ color: '#15803d', fontWeight: 600 }}>
                        {' | '}{L(t, 'active', 'Active')}
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {filtered.length > 0 ? (
        <div className="v-list-table-bottom">
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
            <option value="">{L(t, 'bulkActions', 'Bulk actions')}</option>
            <option value="activate">{L(t, 'activate', 'Activate')}</option>
            <option value="deactivate">{L(t, 'deactivate', 'Deactivate')}</option>
            <option value="delete">{L(t, 'delete', 'Delete')}</option>
          </select>
          <button
            type="button"
            className="v-btn"
            onClick={() => void applyBulk()}
            disabled={!bulkAction || selected.size === 0 || busy === 'bulk'}
          >
            {L(t, 'apply', 'Apply')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
