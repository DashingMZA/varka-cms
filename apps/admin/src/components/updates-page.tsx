'use client';

import { useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { checkUpdatesAction, getAppVersionAction, type PackageUpdate } from '@/actions/updates';

function L(
  t: (ns: 'dashboard' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('dashboard', key);
  if (!v || v === key || v.startsWith('dashboard.')) return fallback;
  return v;
}

export function UpdatesPage() {
  const { t } = useMessages();
  const [packages, setPackages] = useState<PackageUpdate[]>([]);
  const [appVersion, setAppVersion] = useState<{ version: string; commit?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [updRes, verRes] = await Promise.all([
        checkUpdatesAction(),
        getAppVersionAction(),
      ]);
      if (!updRes.ok) {
        setError(updRes.error);
      } else {
        setPackages(updRes.data.packages);
        setCheckedAt(updRes.data.checkedAt);
      }
      if (verRes.ok) {
        setAppVersion(verRes.data);
      }
    } catch {
      setError('Failed to check for updates');
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const varkaUpdates = packages.filter((p) => p.isVarka);
  const depUpdates = packages.filter((p) => !p.isVarka);

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 className="v-page-title">{L(t, 'updates', 'Updates')}</h1>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      {/* App version */}
      <div className="v-panel" style={{ marginTop: 16 }}>
        <h3 className="v-panel__h">{L(t, 'appVersion', 'Application')}</h3>
        <div className="v-panel__b">
          {appVersion ? (
            <p style={{ margin: 0 }}>
              VARKA CMS v{appVersion.version}
              {appVersion.commit ? (
                <span className="v-muted"> ({appVersion.commit})</span>
              ) : null}
            </p>
          ) : (
            <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>
          )}
          <p className="v-muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
            {L(t, 'updatesNote', 'Updates are deployed via git push to your hosting provider (e.g. Vercel auto-deploys on push to main).')}
          </p>
        </div>
      </div>

      {/* Package updates */}
      <div className="v-panel" style={{ marginTop: 16 }}>
        <h3 className="v-panel__h">
          {L(t, 'packageUpdates', 'Package Updates')}
          {checkedAt ? (
            <span className="v-muted" style={{ fontWeight: 'normal', fontSize: 12 }}>
              {' — '}
              {L(t, 'lastChecked', 'Last checked')}: {new Date(checkedAt).toLocaleString()}
            </span>
          ) : null}
        </h3>
        <div className="v-panel__b">
          {loading ? (
            <p className="v-muted">{L(t, 'checking', 'Checking for updates…')}</p>
          ) : packages.length === 0 ? (
            <p className="v-muted">✓ {L(t, 'allUpToDate', 'All packages are up to date.')}</p>
          ) : (
            <>
              {varkaUpdates.length > 0 ? (
                <>
                  <h4 style={{ margin: '0 0 8px' }}>{L(t, 'varkaPackages', 'VARKA Packages')}</h4>
                  <table className="v-table">
                    <thead>
                      <tr>
                        <th>{L(t, 'package', 'Package')}</th>
                        <th>{L(t, 'current', 'Current')}</th>
                        <th>{L(t, 'latest', 'Latest')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {varkaUpdates.map((p) => (
                        <tr key={p.name}>
                          <td><code>{p.name}</code></td>
                          <td><code>{p.current}</code></td>
                          <td><code style={{ color: 'var(--success)' }}>{p.latest}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : null}
              {depUpdates.length > 0 ? (
                <>
                  <h4 style={{ margin: varkaUpdates.length > 0 ? '16px 0 8px' : '0 0 8px' }}>
                    {L(t, 'dependencies', 'Dependencies')}
                  </h4>
                  <table className="v-table">
                    <thead>
                      <tr>
                        <th>{L(t, 'package', 'Package')}</th>
                        <th>{L(t, 'current', 'Current')}</th>
                        <th>{L(t, 'latest', 'Latest')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depUpdates.map((p) => (
                        <tr key={p.name}>
                          <td><code>{p.name}</code></td>
                          <td><code>{p.current}</code></td>
                          <td><code style={{ color: 'var(--success)' }}>{p.latest}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : null}
              <p className="v-muted" style={{ marginTop: 12, fontSize: 12 }}>
                {L(t, 'updateCmd', 'To update, run:')} <code>pnpm update</code>
              </p>
            </>
          )}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="v-btn" onClick={() => void load()} disabled={loading}>
              {L(t, 'checkAgain', 'Check Again')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
