'use client';

import { useRef, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { importContentAction } from '@/actions/tools';

function L(
  t: (ns: 'tools' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('tools', key);
  if (!v || v === key || v.startsWith('tools.')) return fallback;
  return v;
}

export function ImportTool() {
  const { t } = useMessages();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: Record<string, number>; errors: string[] } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const res = await importContentAction(text);
      if (!res.ok) {
        setError(res.error || L(t, 'importFailed', 'Import failed'));
      } else {
        setResult(res.data);
      }
    } catch {
      setError(L(t, 'importFailed', 'Import failed'));
    }
    setLoading(false);
    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 className="v-page-title">{L(t, 'import', 'Import')}</h1>
      <p className="v-muted">
        {L(t, 'importDescLong', 'Upload a VARKA export JSON file to import content. Existing items with the same slug will be skipped.')}
      </p>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="v-alert v-alert--ok">
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
            {L(t, 'importComplete', 'Import complete')}
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {Object.entries(result.imported).map(([k, v]) => (
              <li key={k}>
                {v} {k}
              </li>
            ))}
          </ul>
          {result.errors.length > 0 ? (
            <details style={{ marginTop: 8 }}>
              <summary>
                {result.errors.length} {L(t, 'warnings', 'warnings')}
              </summary>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 12 }}>
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 20 ? <li>…</li> : null}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="v-panel" style={{ marginTop: 16 }}>
        <h3 className="v-panel__h">{L(t, 'uploadFile', 'Upload file')}</h3>
        <div className="v-panel__b">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => void handleFile(e)}
            disabled={loading}
          />
          {loading ? (
            <p className="v-muted" style={{ marginTop: 8 }}>
              {L(t, 'importing', 'Importing…')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
