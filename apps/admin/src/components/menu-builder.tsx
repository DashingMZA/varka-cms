'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { getMenusAction, saveMenusAction } from '@/actions/settings';

type MenuItem = {
  id: string;
  label: string;
  url: string;
  depth?: number;
  children?: MenuItem[];
};

type MenuRecord = {
  id: string;
  name: string;
  location: 'primary' | 'footer' | 'mobile' | 'none';
  items: MenuItem[];
};

function uid() {
  return `mi_${Math.random().toString(36).slice(2, 10)}`;
}

export function MenuBuilder() {
  const { t } = useMessages();
  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const result = await getMenusAction();
    if (!result.ok) {
      setError(t('errors', 'loadFailed') + `: ${result.error}`);
      return;
    }
    const menus = (result.data.menus as MenuRecord[]) ?? [];
    setMenus(menus);
    if (!activeId && menus[0]) setActiveId(menus[0].id);
  }, [activeId, t]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = menus.find((m) => m.id === activeId) ?? menus[0];

  function updateActiveItems(items: MenuItem[]) {
    if (!active) return;
    setMenus((prev) => prev.map((m) => (m.id === active.id ? { ...m, items } : m)));
  }

  function addItem() {
    if (!active || !label.trim()) return;
    const item: MenuItem = {
      id: uid(),
      label: label.trim(),
      url: url.trim() || '/',
    };
    updateActiveItems([...(active.items ?? []), item]);
    setLabel('');
    setUrl('');
  }

  function removeItem(id: string) {
    if (!active) return;
    updateActiveItems(active.items.filter((i) => i.id !== id));
  }

  function onDragStart(id: string) {
    setDragId(id);
  }

  function onDrop(targetId: string) {
    if (!active || !dragId || dragId === targetId) return;
    const items = [...active.items];
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = items.splice(from, 1);
    if (!moved) return;
    items.splice(to, 0, moved);
    updateActiveItems(items);
    setDragId(null);
  }

  function indentItem(id: string) {
    if (!active) return;
    const items = active.items.map((i) => ({ ...i }));
    const idx = items.findIndex((i) => i.id === id);
    if (idx <= 0) return;
    const prev = items[idx - 1];
    const cur = items[idx];
    if (!prev || !cur) return;
    const nextDepth = Math.min((cur.depth ?? 0) + 1, (prev.depth ?? 0) + 1, 3);
    items[idx] = { ...cur, depth: nextDepth };
    updateActiveItems(items);
  }

  function outdentItem(id: string) {
    if (!active) return;
    const items = active.items.map((i) => {
      if (i.id !== id) return i;
      return { ...i, depth: Math.max(0, (i.depth ?? 0) - 1) };
    });
    updateActiveItems(items);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await saveMenusAction(menus as unknown[]);
      if (!result.ok) throw new Error(t('errors', 'saveFailed') + `: ${result.error}`);
      setMessage(t('appearance', 'menusSaved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors', 'saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function setLocation(loc: MenuRecord['location']) {
    if (!active) return;
    setMenus((prev) => prev.map((m) => (m.id === active.id ? { ...m, location: loc } : m)));
  }

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <h1 className="v-page-title" style={{ margin: 0 }}>
        {t('appearance', 'menus')}
      </h1>
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>
          {t('appearance', 'menuName')}{' '}
          <select value={active?.id ?? ''} onChange={(e) => setActiveId(e.target.value)}>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13 }}>
          {t('appearance', 'location')}{' '}
          <select
            value={active?.location ?? 'none'}
            onChange={(e) => setLocation(e.target.value as MenuRecord['location'])}
          >
            <option value="primary">{t('appearance', 'locPrimary')}</option>
            <option value="footer">{t('appearance', 'locFooter')}</option>
            <option value="mobile">{t('appearance', 'locMobile')}</option>
            <option value="none">{t('appearance', 'locNone')}</option>
          </select>
        </label>
        <button type="button" className="v-btn v-btn--primary" disabled={saving} onClick={() => void save()}>
          {saving ? t('common', 'saving') : t('appearance', 'saveMenu')}
        </button>
      </div>

      <div className="v-panel" style={{ padding: 12 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 13 }}>{t('appearance', 'addItem')}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder={t('appearance', 'itemLabel')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label={t('appearance', 'itemLabel')}
          />
          <input
            placeholder={t('appearance', 'itemUrl')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label={t('appearance', 'itemUrl')}
          />
          <button type="button" className="v-btn" onClick={addItem}>
            {t('appearance', 'addToMenu')}
          </button>
        </div>
      </div>

      <div className="v-panel" style={{ padding: 0 }}>
        <h3 style={{ margin: 0, padding: 12, fontSize: 13, borderBottom: '1px solid var(--wp-border)' }}>
          {t('appearance', 'structure')}
        </h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {(active?.items ?? []).map((item) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => onDragStart(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                paddingLeft: 12 + (item.depth ?? 0) * 20,
                borderBottom: '1px solid var(--wp-border)',
                cursor: 'grab',
                background: dragId === item.id ? '#f0f6fc' : '#fff',
              }}
            >
              <span aria-hidden style={{ color: 'var(--wp-muted)' }}>
                ⋮⋮
              </span>
              <strong style={{ fontSize: 13 }}>{item.label}</strong>
              <span className="v-muted" style={{ fontSize: 12 }}>
                {item.url}
              </span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button type="button" className="v-btn" title={t('appearance', 'outdent')} onClick={() => outdentItem(item.id)}>
                  ⇤
                </button>
                <button type="button" className="v-btn" title={t('appearance', 'indent')} onClick={() => indentItem(item.id)}>
                  ⇥
                </button>
                <button type="button" className="v-btn" onClick={() => removeItem(item.id)}>
                  {t('common', 'delete')}
                </button>
              </span>
            </li>
          ))}
          {(active?.items ?? []).length === 0 ? (
            <li className="v-muted" style={{ padding: 12, fontSize: 13 }}>
              {t('appearance', 'noItems')}
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
