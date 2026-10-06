'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { getWidgetsAction, saveWidgetsAction } from '@/actions/settings';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'widgets' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('widgets', key);
  if (!v || v === key || v.startsWith('widgets.')) return fallback;
  return v;
}

type WidgetInstance = {
  id: string;
  type: 'recent_posts' | 'categories' | 'search' | 'custom_html' | 'tag_cloud';
  title: string;
};

type WidgetZone = {
  id: string;
  name: string;
  widgets: WidgetInstance[];
};

function uid() {
  return `w_${Math.random().toString(36).slice(2, 10)}`;
}

const TYPES: WidgetInstance['type'][] = [
  'recent_posts',
  'categories',
  'search',
  'custom_html',
  'tag_cloud',
];

const TYPE_KEYS: Record<WidgetInstance['type'], string> = {
  recent_posts: 'recentPosts',
  categories: 'categories',
  search: 'search',
  custom_html: 'customHtml',
  tag_cloud: 'tagCloud',
};

export function WidgetsAdmin() {
  const { t } = useMessages();
  const [zones, setZones] = useState<WidgetZone[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState<{ zoneId: string; widgetId: string } | null>(null);

  const load = useCallback(async () => {
    const result = await getWidgetsAction();
    if (!result.ok) {
      setError(L(t, 'loadFailed', 'Load failed: {error}').replace('{error}', result.error));
      return;
    }
    setZones((result.data as { zones: WidgetZone[] }).zones ?? []);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  function addWidget(zoneId: string, type: WidgetInstance['type']) {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              widgets: [
                ...z.widgets,
                { id: uid(), type, title: L(t, TYPE_KEYS[type], type.replace(/_/g, ' ')) },
              ],
            }
          : z,
      ),
    );
  }

  function removeWidget(zoneId: string, widgetId: string) {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? { ...z, widgets: z.widgets.filter((w) => w.id !== widgetId) }
          : z,
      ),
    );
  }

  function onDrop(zoneId: string, targetWidgetId: string) {
    if (!drag) return;
    setZones((prev) => {
      const copy = prev.map((z) => ({ ...z, widgets: [...z.widgets] }));
      const fromZone = copy.find((z) => z.id === drag.zoneId);
      const toZone = copy.find((z) => z.id === zoneId);
      if (!fromZone || !toZone) return prev;
      const idx = fromZone.widgets.findIndex((w) => w.id === drag.widgetId);
      if (idx < 0) return prev;
      const [moved] = fromZone.widgets.splice(idx, 1);
      if (!moved) return prev;
      const toIdx = toZone.widgets.findIndex((w) => w.id === targetWidgetId);
      if (toIdx < 0) toZone.widgets.push(moved);
      else toZone.widgets.splice(toIdx, 0, moved);
      return copy;
    });
    setDrag(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await saveWidgetsAction(zones as unknown);
      if (!result.ok) throw new Error(L(t, 'saveFailed', 'Save failed: {error}').replace('{error}', result.error));
      setMessage(L(t, 'widgetsSaved', 'Widgets saved.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      <button type="button" className="v-btn v-btn--primary" style={{ width: 'fit-content' }} disabled={saving} onClick={() => void save()}>
        {saving ? L(t, 'saving', 'Saving…') : L(t, 'saveWidgets', 'Save Widgets')}
      </button>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {zones.map((zone) => (
          <div key={zone.id} className="v-panel" style={{ padding: 12 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>{zone.name}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {TYPES.map((ty) => (
                <button key={ty} type="button" className="v-btn" style={{ fontSize: 11 }} onClick={() => addWidget(zone.id, ty)}>
                  + {L(t, TYPE_KEYS[ty], ty.replace(/_/g, ' '))}
                </button>
              ))}
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {zone.widgets.map((w) => (
                <li
                  key={w.id}
                  draggable
                  onDragStart={() => setDrag({ zoneId: zone.id, widgetId: w.id })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(zone.id, w.id)}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--wp-border)',
                    cursor: 'grab',
                    fontSize: 13,
                  }}
                >
                  <span aria-hidden>⋮⋮</span>
                  <span style={{ textTransform: 'capitalize' }}>{w.title}</span>
                  <button type="button" className="v-btn" style={{ marginInlineStart: 'auto', fontSize: 11 }} onClick={() => removeWidget(zone.id, w.id)}>
                    {L(t, 'remove', 'Remove')}
                  </button>
                </li>
              ))}
              {zone.widgets.length === 0 ? (
                <li className="v-muted" style={{ fontSize: 12 }}>{L(t, 'emptyZone', 'Empty zone')}</li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
