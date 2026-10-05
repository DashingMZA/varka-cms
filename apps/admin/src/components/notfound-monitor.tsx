'use client';

import { useEffect, useState } from 'react';
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

  async function load() {
    const res = await listNotFoundLogsAction();
    if (!res.ok) {
      setError(res.error);
    } else {
      setLogs(res.data as LogEntry[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleClear() {
    if (!window.confirm(L(t, 'clearConfirm', 'Clear all 404 logs?'))) return;
    const res = await clearNotFoundLogsAction();
    if (res.ok) await load();
  }

  async function handleDelete(id: string) {
    const res = await deleteNotFoundLogAction(id);
    if (res.ok) await load();
  }

  if (loading) return <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="v-page-title">{L(t, 'notFoundMonitor', '404 Monitor')}</h1>
        {logs.length > 0 ? (
          <button type="button" className="v-btn" onClick={() => void handleClear()}>
            {L(t, 'clearAll', 'Clear All')}
          </button>
        ) : null}
      </div>
      <p className="v-muted">
        {L(t, 'notFoundDesc', 'URLs that returned 404 errors on your site.')}
      </p>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      {logs.length === 0 ? (
        <p className="v-muted">{L(t, 'noNotFound', 'No 404 errors logged yet.')}</p>
      ) : (
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
                <td>{log.hits}</td>
                <td>{new Date(log.lastSeen).toLocaleString()}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.referrer || '—'}
                </td>
                <td>
                  <button
                    type="button"
                    className="v-btn v-btn--small"
                    onClick={() => void handleDelete(log.id)}
                  >
                    {L(t, 'delete', 'Delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
