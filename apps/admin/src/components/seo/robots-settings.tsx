'use client';

import { useEffect, useState } from 'react';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';
import { DEFAULT_ROBOTS_TXT, servedRobotsTxt } from '@varka/seo';

/** robots.txt editor — ported from BMS-CMS. */
export function RobotsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [robotsTxt, setRobotsTxt] = useState(DEFAULT_ROBOTS_TXT);

  useEffect(() => {
    void (async () => {
      try {
        const result = await getSeoSettingsAction();
        if (result.ok && result.data) {
          const data = result.data as Record<string, string>;
          if (data.seo_robots_txt) setRobotsTxt(data.seo_robots_txt);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null); setError(null);
    try {
      const result = await saveSeoSettingsAction({ seo_robots_txt: robotsTxt });
      if (result.ok) { setMessage('Settings saved.'); } else { setError(result.error || 'Save failed'); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
    setSaving(false);
  }

  function reset() {
    setRobotsTxt(DEFAULT_ROBOTS_TXT);
  }

  if (loading) return <p className="v-muted">Loading…</p>;

  // Show what will actually be served (with BMS repairs applied)
  const served = servedRobotsTxt(robotsTxt);
  const repaired = served !== robotsTxt;

  return (
    <div>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      <div className="v-card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>robots.txt</h2>
        <p className="v-muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
          Served at <code>/robots.txt</code>. Your sitemap URL is appended automatically.
        </p>
        <textarea
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, minHeight: 300, padding: 12 }}
          value={robotsTxt}
          onChange={(e) => setRobotsTxt(e.target.value)}
          spellCheck={false}
        />
        {repaired ? (
          <div className="v-alert" style={{ marginTop: 12 }}>
            <strong>Auto-repair:</strong> When served, legacy rules will be fixed and search rules added:
            <pre style={{ fontSize: 11, marginTop: 8, whiteSpace: 'pre-wrap' }}>{served}</pre>
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" className="v-btn v-btn--primary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" className="v-btn" onClick={reset}>
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
