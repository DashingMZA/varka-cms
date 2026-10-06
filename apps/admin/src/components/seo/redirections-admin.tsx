'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import {
  listRedirectionsAction,
  createRedirectionAction,
  updateRedirectionAction,
  deleteRedirectionAction,
  bulkDeleteRedirectionsAction,
  toggleRedirectionAction,
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

type Redirection = {
  id: string;
  source: string;
  target: string;
  code: number;
  hits: number;
  active: boolean;
  createdAt: string;
};

const PAGE_SIZE = 20;

/** Rank Math-style Redirections manager. */
export function RedirectionsAdmin({ searchParams }: { searchParams?: Promise<{ source?: string }> }) {
  const { t } = useMessages();
  const [items, setItems] = useState<Redirection[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [code, setCode] = useState('301');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Prefill source from ?source= (e.g. "Redirect" action in 404 Monitor)
  useEffect(() => {
    if (!searchParams) return;
    void searchParams.then((p) => {
      if (p?.source) setSource(p.source);
    });
  }, [searchParams]);

  async function load() {
    setLoading(true);
    try {
      const result = await listRedirectionsAction();
      if (result.ok) setItems((result.data as Redirection[]) ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? items.filter(
          (r) => r.source.toLowerCase().includes(q) || r.target.toLowerCase().includes(q),
        )
      : items;
    return [...list].toSorted((a, b) => b.hits - a.hits || a.source.localeCompare(b.source));
  }, [items, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetForm() {
    setSource('');
    setTarget('');
    setCode('301');
    setEditingId(null);
    setError(null);
  }

  function startEdit(r: Redirection) {
    setEditingId(r.id);
    setSource(r.source);
    setTarget(r.target);
    setCode(String(r.code));
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    if (!source.trim() || !target.trim()) {
      setError(L(t, 'sourceTargetRequired', 'Source and target are required.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = { source: source.trim(), target: target.trim(), code: Number(code) };
      const result = editingId
        ? await updateRedirectionAction(editingId, input)
        : await createRedirectionAction(input);
      if (result.ok) {
        resetForm();
        await load();
      } else {
        setError(result.error || L(t, 'saveFailed', 'Save failed'));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : L(t, 'saveFailed', 'Save failed'));
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!window.confirm(L(t, 'deleteRedirectionConfirm', 'Delete this redirection?'))) return;
    await deleteRedirectionAction(id);
    await load();
  }

  async function toggle(id: string, active: boolean) {
    await toggleRedirectionAction(id, !active);
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, active: !active } : r)));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectPage() {
    const ids = pageItems.map((r) => r.id);
    const all = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (all) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!window.confirm(L(t, 'bulkDeleteConfirm', `Delete ${selected.size} redirections?`))) return;
    setBusy(true);
    await bulkDeleteRedirectionsAction([...selected]);
    setSelected(new Set());
    await load();
    setBusy(false);
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{L(t, 'redirectionsTitle', 'Redirections')}</h1>
      </div>
      <p className="v-page-desc" style={{ marginTop: 0, maxWidth: 720 }}>
        {L(t, 'redirectionsDesc', 'Send visitors from old or broken URLs to the right page.')}
      </p>
      <div className="v-card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>
          {editingId ? L(t, 'editRedirection', 'Edit Redirection') : L(t, 'addRedirection', 'Add Redirection')}
        </h2>
        {error ? <p className="v-alert v-alert--error">{error}</p> : null}
        <div className="v-grid-3">
          <label style={{ display: 'block', minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
              {L(t, 'sourceUrl', 'Source URL')}
            </span>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="/old-path"
              style={{ width: '100%' }}
            />
          </label>
          <label style={{ display: 'block', minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
              {L(t, 'targetUrl', 'Target URL')}
            </span>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="/new-path or https://…"
              style={{ width: '100%' }}
            />
          </label>
          <label style={{ display: 'block', minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
              {L(t, 'type', 'Type')}
            </span>
            <select value={code} onChange={(e) => setCode(e.target.value)} style={{ width: '100%' }}>
              <option value="301">301 {L(t, 'permanent', 'Permanent')}</option>
              <option value="302">302 {L(t, 'temporary', 'Temporary')}</option>
              <option value="307">307 {L(t, 'temporary', 'Temporary')}</option>
              <option value="410">410 {L(t, 'gone', 'Gone')}</option>
              <option value="451">451 {L(t, 'unavailableLegal', 'Unavailable (legal)')}</option>
            </select>
          </label>
        </div>
        <div className="v-btn-row">
          <button
            type="button"
            className="v-btn v-btn--primary"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving
              ? L(t, 'saving', 'Saving…')
              : editingId
                ? L(t, 'updateRedirection', 'Update Redirection')
                : L(t, 'addRedirectionBtn', 'Add Redirection')}
          </button>
          {editingId ? (
            <button type="button" className="v-btn" onClick={resetForm}>
              {L(t, 'cancel', 'Cancel')}
            </button>
          ) : null}
        </div>
        <p className="v-muted" style={{ fontSize: 13, margin: '8px 0 0' }}>
          {L(t, 'redirectionHint', 'Source is matched against the request path (e.g. /old-post). Use a full URL as target to redirect off-site.')}
        </p>
      </div>

      <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 0' }}>
          <div className="v-page-header" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>
              {L(t, 'redirections', 'Redirections')}{' '}
              <span className="v-badge">{filtered.length}</span>
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder={L(t, 'searchRedirections', 'Search source or target…')}
                style={{ minWidth: 200 }}
                aria-label={L(t, 'searchRedirections', 'Search source or target…')}
              />
              {selected.size > 0 ? (
                <button type="button" className="v-btn v-btn--danger v-btn--small" onClick={() => void bulkDelete()} disabled={busy}>
                  {L(t, 'deleteSelected', 'Delete selected')} ({selected.size})
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {loading ? (
          <p className="v-muted" style={{ padding: '0 16px 16px' }}>{L(t, 'loading', 'Loading…')}</p>
        ) : filtered.length === 0 ? (
          <p className="v-muted" style={{ padding: '0 16px 24px' }}>
            {query
              ? L(t, 'noRedirectionsFound', 'No redirections match your search.')
              : L(t, 'noRedirections', 'No redirections yet. Add your first one above.')}
          </p>
        ) : (
          <>
            <div className="v-table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="v-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={pageItems.length > 0 && pageItems.every((r) => selected.has(r.id))}
                        onChange={toggleSelectPage}
                        aria-label={L(t, 'selectAll', 'Select all')}
                      />
                    </th>
                    <th>{L(t, 'source', 'Source')}</th>
                    <th>{L(t, 'target', 'Target')}</th>
                    <th style={{ width: 70 }}>{L(t, 'type', 'Type')}</th>
                    <th style={{ width: 80 }}>{L(t, 'hits', 'Hits')}</th>
                    <th style={{ width: 90 }}>{L(t, 'active', 'Active')}</th>
                    <th style={{ width: 130 }}><span className="v-screen-reader-text">{L(t, 'actions', 'Actions')}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r) => (
                    <tr key={r.id} style={!r.active ? { opacity: 0.6 } : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          aria-label={r.source}
                        />
                      </td>
                      <td><code style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{r.source}</code></td>
                      <td><code style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{r.target}</code></td>
                      <td><span className="v-badge">{r.code}</span></td>
                      <td>{r.hits}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.active}
                          onChange={() => void toggle(r.id, r.active)}
                          aria-label={`${L(t, 'active', 'Active')}: ${r.source}`}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button type="button" className="v-btn v-btn--small" onClick={() => startEdit(r)}>
                            {L(t, 'edit', 'Edit')}
                          </button>
                          <button type="button" className="v-btn v-btn--small v-btn--danger" onClick={() => void remove(r.id)}>
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
          </>
        )}
      </div>
    </div>
  );
}
