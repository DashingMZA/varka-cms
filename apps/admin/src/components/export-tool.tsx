'use client';

import { useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { exportContentAction, type ExportContentType } from '@/actions/tools';

function L(
  t: (ns: 'tools' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('tools', key);
  if (!v || v === key || v.startsWith('tools.')) return fallback;
  return v;
}

const CONTENT_TYPES: { id: ExportContentType; fallback: string }[] = [
  { id: 'posts', fallback: 'Posts' },
  { id: 'pages', fallback: 'Pages' },
  { id: 'media', fallback: 'Media' },
  { id: 'categories', fallback: 'Categories' },
  { id: 'tags', fallback: 'Tags' },
  { id: 'comments', fallback: 'Comments' },
];

export function ExportTool() {
  const { t } = useMessages();
  const [selected, setSelected] = useState<Set<ExportContentType>>(
    new Set(['posts', 'pages', 'categories', 'tags']),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ filename: string; counts: Record<string, number> } | null>(null);

  function toggle(id: ExportContentType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExport() {
    if (selected.size === 0) {
      setError(L(t, 'selectAtLeastOne', 'Select at least one content type'));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await exportContentAction(Array.from(selected));
      if (!res.ok) {
        setError(res.error || L(t, 'exportFailed', 'Export failed'));
        setLoading(false);
        return;
      }
      // Trigger download
      const blob = new Blob([res.data.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setResult({ filename: res.data.filename, counts: res.data.counts });
    } catch {
      setError(L(t, 'exportFailed', 'Export failed'));
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 className="v-page-title">{L(t, 'export', 'Export')}</h1>
      <p className="v-muted">
        {L(t, 'exportDesc', 'Download your content as a JSON file. You can import it back later.')}
      </p>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      {result ? (
        <p className="v-alert v-alert--ok">
          {L(t, 'exportSuccess', 'Exported')} {result.filename} —{' '}
          {Object.entries(result.counts)
            .map(([k, v]) => `${v} ${k}`)
            .join(', ')}
        </p>
      ) : null}

      <div className="v-panel" style={{ marginTop: 16 }}>
        <h3 className="v-panel__h">{L(t, 'chooseContent', 'Choose content to export')}</h3>
        <div className="v-panel__b" style={{ display: 'grid', gap: 8 }}>
          {CONTENT_TYPES.map((ct) => (
            <label key={ct.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={selected.has(ct.id)}
                onChange={() => toggle(ct.id)}
              />
              {L(t, ct.id, ct.fallback)}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          className="v-btn v-btn--primary"
          onClick={() => void handleExport()}
          disabled={loading || selected.size === 0}
        >
          {loading ? L(t, 'exporting', 'Exporting…') : L(t, 'downloadExport', 'Download Export File')}
        </button>
      </div>
    </div>
  );
}
