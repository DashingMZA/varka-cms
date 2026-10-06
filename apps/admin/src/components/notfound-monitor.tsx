'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMessages } from '@/lib/i18n';
import { listNotFoundLogsAction, clearNotFoundLogsAction, deleteNotFoundLogAction } from '@/actions/seo-tools';

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
  lastSeen: string;
  referrer: string | null;
};

export function NotFoundMonitor() {
  const { t } = useMessages();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
  }, []);

  async function handleClear() {
    if (!window.confirm(L(t, 'clearConfirm', 'Clear all 404 logs?'))) return;
    setBusy(true);
    const res = await clearNotFoundLogsAction();
    if (res.ok) await load();
    setBusy(false);
  }

  async function handleDelete(id: string) {
    const res = await deleteNotFoundLogAction(id);
    if (res.ok) await load();
  }

  const stats = useMemo(() => {
    const totalHits = logs.reduce((sum, l) => sum + (l.hits || 0), 0);
    const today = new Date().toDateString();
    const todayHits = logs
      .filter((l) => new Date(l.lastSeen).toDateString() === today)
      .reduce((sum, l) => sum + (l.hits || 0), 0);
    const top = [...logs].sort((a, b) => (b.hits || 0) - (a.hits || 0))[0];
    return { urls: logs.length, totalHits, todayHits, top };
  }, [logs]);

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
            <button type="button" className="v-btn" onClick={() => void handleClear()} disabled={busy}>
              {L(t, 'clearAll', 'Clear All')}
            </button>
          ) : null}
        </div>
      </div>
      <p className="v-muted" style={{ marginTop: 0 }}>
        {L(t, 'notFoundDesc', 'URLs that returned 404 errors on your site. Fix them with a redirection so visitors and search engines land on the right page.')}
      </p>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      {/* Stats */}
      <div className="v-dash-grid" style={{ marginBottom: 16 }}>
        <div className="v-card" style={{ padding: 16 }}>
          <div className="v-muted" style={{ fontSize: 12, marginBottom: 4 }}>{L(t, 'statUrls', 'Broken URLs')}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.urls}</div>
        </div>
        <div className="v-card" style={{ padding: 16 }}>
          <div className="v-muted" style={{ fontSize: 12, marginBottom: 4 }}>{L(t, 'statHits', 'Total 404 hits')}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.totalHits}</div>
        </div>
        <div className="v-card" style={{ padding: 16 }}>
          <div className="v-muted" style={{ fontSize: 12, marginBottom: 4 }}>{L(t, 'statToday', 'Hits today')}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.todayHits}</div>
        </div>
        <div className="v-card" style={{ padding: 16 }}>
          <div className="v-muted" style={{ fontSize: 12, marginBottom: 4 }}>{L(t, 'statTop', 'Most hit URL')}</div>
          <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={stats.top?.path}>
            {stats.top ? <code style={{ fontSize: 12 }}>{stats.top.path}</code> : '—'}
          </div>
          {stats.top ? <div className="v-muted" style={{ fontSize: 12 }}>{stats.top.hits} hits</div> : null}
        </div>
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
        <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="v-table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="v-table">
              <thead>
                <tr>
                  <th>{L(t, 'url', 'URL')}</th>
                  <th>{L(t, 'hits', 'Hits')}</th>
                  <th>{L(t, 'lastSeen', 'Last Seen')}</th>
                  <th>{L(t, 'referrer', 'Referrer')}</th>
                  <th>{L(t, 'actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <code style={{ fontSize: 12 }}>{log.path}</code>
                    </td>
                    <td>
                      <span className="v-badge">{log.hits}</span>
                    </td>
                    <td>{new Date(log.lastSeen).toLocaleString()}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.referrer ?? ''}>
                      {log.referrer || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Link
                          href={`/seo/redirections?source=${encodeURIComponent(log.path)}`}
                          className="v-btn v-btn--small"
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
        </div>
      )}
    </div>
  );
}
