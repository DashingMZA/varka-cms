'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMessages } from '@/lib/i18n';
import {
  listNotFoundLogsAction,
  clearNotFoundLogsAction,
  deleteNotFoundLogAction,
  bulkDeleteNotFoundLogsAction,
  getSeoSettingsAction,
  saveSeoSettingsAction,
} from '@/actions/seo-tools';

function L(
  t: (ns: 'seo' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('seo', key);
  if (!v || v === key || v.startsWith('seo.')) return fallback;
  return v;
}

type LogEntry = {
  id: string;
  path: string;
  hits: number;
  firstSeen: string;
  lastSeen: string;
  referrer: string | null;
};

type SortKey = 'hits' | 'lastSeen' | 'firstSeen' | 'path';

const PAGE_SIZE = 20;

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

function StatCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent: string }) {
  return (
    <div className="v-card" style={{ padding: 16, borderTop: `3px solid ${accent}`, minWidth: 0 }}>
      <div className="v-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      {sub ? <div className="v-muted" style={{ fontSize: 12, marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}

export function NotFoundMonitor() {
  const { t, locale } = useMessages();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('hits');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exclude, setExclude] = useState('');
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  async function load() {
    setLoading(true);
    const res = await listNotFoundLogsAction();
    if (!res.ok) {
      setError(res.error);
    } else {
      setLogs(res.data as LogEntry[]);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    void (async () => {
      try {
        const res = await getSeoSettingsAction();
        if (res.ok && res.data) {
          const v = (res.data as Record<string, unknown>).notFoundExclude;
          if (typeof v === 'string') setExclude(v);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const res = await saveSeoSettingsAction({ notFoundExclude: exclude });
      if (res.ok) {
        setSettingsMsg(L(t, 'saved', 'Settings saved.'));
        await load(); // re-apply exclusions
      }
    } catch {
      /* ignore */
    }
    setSavingSettings(false);
  }

  async function handleClear() {
    if (!window.confirm(L(t, 'clearConfirm', 'Clear all 404 logs?'))) return;
    setBusy(true);
    const res = await clearNotFoundLogsAction();
    if (res.ok) {
      setSelected(new Set());
      await load();
    }
    setBusy(false);
  }

  async function handleDelete(id: string) {
    const res = await deleteNotFoundLogAction(id);
    if (res.ok) {
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!window.confirm(L(t, 'bulkDelete404Confirm', `Delete ${selected.size} log entries?`))) return;
    setBusy(true);
    const res = await bulkDeleteNotFoundLogsAction([...selected]);
    if (res.ok) {
      setSelected(new Set());
      await load();
    }
    setBusy(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? logs.filter((l) => l.path.toLowerCase().includes(q)) : [...logs];
    list.sort((a, b) => {
      switch (sort) {
        case 'hits':
          return b.hits - a.hits;
        case 'lastSeen':
          return +new Date(b.lastSeen) - +new Date(a.lastSeen);
        case 'firstSeen':
          return +new Date(b.firstSeen) - +new Date(a.firstSeen);
        case 'path':
          return a.path.localeCompare(b.path);
      }
    });
    return list;
  }, [logs, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const totalHits = logs.reduce((sum, l) => sum + (l.hits || 0), 0);
    const today = new Date().toDateString();
    const todayHits = logs
      .filter((l) => new Date(l.lastSeen).toDateString() === today)
      .reduce((sum, l) => sum + (l.hits || 0), 0);
    const top = [...logs].toSorted((a, b) => (b.hits || 0) - (a.hits || 0))[0];
    return { urls: logs.length, totalHits, todayHits, top };
  }, [logs]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectPage() {
    const ids = pageItems.map((l) => l.id);
    const all = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (all) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  if (loading) return <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>;

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{L(t, 'notFoundMonitor', '404 Monitor')}</h1>
        <div className="v-btn-row" style={{ margin: 0 }}>
          <button type="button" className="v-btn" onClick={() => void load()} disabled={busy}>
            {L(t, 'refresh', 'Refresh')}
          </button>
          {logs.length > 0 ? (
            <button type="button" className="v-btn v-btn--danger" onClick={() => void handleClear()} disabled={busy}>
              {L(t, 'clearAll', 'Clear All')}
            </button>
          ) : null}
        </div>
      </div>
      <p className="v-muted" style={{ marginTop: 0, maxWidth: 720 }}>
        {L(t, 'notFoundDesc', 'URLs that returned 404 errors on your site. Fix them with a redirection so visitors and search engines land on the right page.')}
      </p>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      {/* Stats */}
      <div className="v-dash-grid" style={{ marginBottom: 16 }}>
        <StatCard
          label={L(t, 'statUrls', 'Broken URLs')}
          value={stats.urls}
          accent="#d63638"
        />
        <StatCard
          label={L(t, 'statHits', 'Total 404 hits')}
          value={stats.totalHits.toLocaleString(locale)}
          accent="#dba617"
        />
        <StatCard
          label={L(t, 'statToday', 'Hits today')}
          value={stats.todayHits.toLocaleString(locale)}
          accent="#2271b1"
        />
        <StatCard
          label={L(t, 'statTop', 'Most hit URL')}
          value={
            stats.top ? (
              <code
                style={{
                  fontSize: 13,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={stats.top.path}
              >
                {stats.top.path}
              </code>
            ) : (
              '—'
            )
          }
          sub={stats.top ? `${stats.top.hits} ${L(t, 'hits', 'hits')}` : undefined}
          accent="#00a32a"
        />
      </div>

      {logs.length === 0 ? (
        <div className="v-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">✓</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>{L(t, 'noNotFoundTitle', 'No 404 errors')}</h2>
          <p className="v-muted" style={{ margin: '0 auto', maxWidth: 420 }}>
            {L(t, 'noNotFound', 'No 404 errors logged yet. When visitors hit a missing URL, it will appear here so you can redirect it.')}
          </p>
        </div>
      ) : (
        <div className="v-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '16px 16px 0' }}>
            <div className="v-page-header" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>
                {L(t, 'brokenUrls', 'Broken URLs')} <span className="v-badge">{filtered.length}</span>
              </h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder={L(t, 'searchUrls', 'Search URLs…')}
                  style={{ minWidth: 180 }}
                  aria-label={L(t, 'searchUrls', 'Search URLs…')}
                />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label={L(t, 'sortBy', 'Sort by')}
                >
                  <option value="hits">{L(t, 'sortHits', 'Most hits')}</option>
                  <option value="lastSeen">{L(t, 'sortLastSeen', 'Recently seen')}</option>
                  <option value="firstSeen">{L(t, 'sortFirstSeen', 'First seen')}</option>
                  <option value="path">{L(t, 'sortPath', 'URL A–Z')}</option>
                </select>
                {selected.size > 0 ? (
                  <button type="button" className="v-btn v-btn--danger v-btn--small" onClick={() => void handleBulkDelete()} disabled={busy}>
                    {L(t, 'deleteSelected', 'Delete selected')} ({selected.size})
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="v-table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={pageItems.length > 0 && pageItems.every((l) => selected.has(l.id))}
                      onChange={toggleSelectPage}
                      aria-label={L(t, 'selectAll', 'Select all')}
                    />
                  </th>
                  <th>{L(t, 'url', 'URL')}</th>
                  <th style={{ width: 90 }}>{L(t, 'hits', 'Hits')}</th>
                  <th style={{ width: 170 }}>{L(t, 'lastSeen', 'Last Seen')}</th>
                  <th style={{ width: 170 }}>{L(t, 'firstSeen', 'First Seen')}</th>
                  <th>{L(t, 'referrer', 'Referrer')}</th>
                  <th style={{ width: 150 }}><span className="v-screen-reader-text">{L(t, 'actions', 'Actions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(log.id)}
                        onChange={() => toggleSelect(log.id)}
                        aria-label={log.path}
                      />
                    </td>
                    <td>
                      <code style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{log.path}</code>
                    </td>
                    <td>
                      <span className="v-badge" style={log.hits >= 10 ? { background: '#fde8e8', borderColor: '#f5c6c6', color: '#b32d2e' } : undefined}>
                        {log.hits}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{formatDate(log.lastSeen, locale)}</td>
                    <td style={{ fontSize: 12 }}>{formatDate(log.firstSeen, locale)}</td>
                    <td
                      style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}
                      title={log.referrer ?? ''}
                    >
                      {log.referrer || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Link
                          href={`/seo/redirections?source=${encodeURIComponent(log.path)}`}
                          className="v-btn v-btn--small v-btn--primary"
                        >
                          {L(t, 'redirect', 'Redirect')}
                        </Link>
                        <button
                          type="button"
                          className="v-btn v-btn--small"
                          onClick={() => void handleDelete(log.id)}
                        >
                          {L(t, 'delete', 'Delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 ? (
            <div className="v-list-table-bottom" style={{ padding: '12px 16px' }}>
              <button type="button" className="v-btn v-btn--small" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                ← {L(t, 'previous', 'Previous')}
              </button>
              <span className="v-muted" style={{ fontSize: 13 }}>
                {L(t, 'pageOf', 'Page')} {safePage} {L(t, 'of', 'of')} {pageCount}
              </span>
              <button type="button" className="v-btn v-btn--small" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>
                {L(t, 'next', 'Next')} →
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Monitor settings */}
      <div className="v-card">
        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>{L(t, 'monitorSettings', 'Monitor Settings')}</h2>
        <p className="v-muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
          {L(t, 'monitorSettingsDesc', 'Paths listed here are never logged as 404s — useful for bots probing wp-login.php or favicon.ico.')}
        </p>
        {settingsMsg ? <p className="v-alert v-alert--ok">{settingsMsg}</p> : null}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            {L(t, 'excludePaths', 'Exclude paths')}
          </span>
          <textarea
            value={exclude}
            onChange={(e) => setExclude(e.target.value)}
            rows={3}
            placeholder={'/wp-login.php\n/favicon.ico'}
            style={{ width: '100%', maxWidth: 560, fontFamily: 'monospace', fontSize: 13 }}
          />
          <span className="v-muted" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
            {L(t, 'excludePathsDesc', 'One path per line. Any 404 URL containing one of these is skipped.')}
          </span>
        </label>
        <button type="button" className="v-btn v-btn--primary" onClick={() => void saveSettings()} disabled={savingSettings}>
          {savingSettings ? L(t, 'saving', 'Saving…') : L(t, 'saveChanges', 'Save Changes')}
        </button>
      </div>
    </div>
  );
}
