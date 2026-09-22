'use client';

import { useCallback, useEffect, useState } from 'react';

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
  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/menus', { credentials: 'include' });
    if (!res.ok) {
      setError(`Load failed (${res.status})`);
      return;
    }
    const data = (await res.json()) as { menus: MenuRecord[] };
    setMenus(data.menus ?? []);
    if (!activeId && data.menus?.[0]) setActiveId(data.menus[0].id);
  }, [activeId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = menus.find((m) => m.id === activeId) ?? menus[0];

  function updateActiveItems(items: MenuItem[]) {
    if (!active) return;
    setMenus((prev) =>
      prev.map((m) => (m.id === active.id ? { ...m, items } : m)),
    );
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
      const res = await fetch('/api/menus', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setMessage('Menus saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save error');
    } finally {
      setSaving(false);
    }
  }

  function setLocation(loc: MenuRecord['location']) {
    if (!active) return;
    setMenus((prev) =>
      prev.map((m) => (m.id === active.id ? { ...m, location: loc } : m)),
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>
          Menu{' '}
          <select
            value={active?.id ?? ''}
            onChange={(e) => setActiveId(e.target.value)}
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13 }}>
          Location{' '}
          <select
            value={active?.location ?? 'none'}
            onChange={(e) => setLocation(e.target.value as MenuRecord['location'])}
          >
            <option value="primary">Primary</option>
            <option value="footer">Footer</option>
            <option value="mobile">Mobile</option>
            <option value="none">— Not assigned —</option>
          </select>
        </label>
        <button type="button" className="v-btn v-btn--primary" disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save Menu'}
        </button>
      </div>

      <div className="v-panel" style={{ padding: 12 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 13 }}>Add item</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label="Item label"
          />
          <input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Item URL"
          />
          <button type="button" className="v-btn" onClick={addItem}>
            Add to Menu
          </button>
        </div>
      </div>

      <div className="v-panel" style={{ padding: 0 }}>
        <h3 style={{ margin: 0, padding: 12, fontSize: 13, borderBottom: '1px solid var(--wp-border)' }}>
          Structure (drag to reorder)
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
                <button type="button" className="v-btn" title="Outdent" onClick={() => outdentItem(item.id)}>
                  ⇤
                </button>
                <button type="button" className="v-btn" title="Indent" onClick={() => indentItem(item.id)}>
                  ⇥
                </button>
                <button type="button" className="v-btn" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </span>
            </li>
          ))}
          {(active?.items ?? []).length === 0 ? (
            <li className="v-muted" style={{ padding: 12, fontSize: 13 }}>
              No items yet. Add a label and URL above.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
