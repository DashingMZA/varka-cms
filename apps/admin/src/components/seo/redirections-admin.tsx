'use client';

import { useEffect, useState } from 'react';
import {
  listRedirectionsAction,
  createRedirectionAction,
  deleteRedirectionAction,
  toggleRedirectionAction,
} from '@/actions/seo-tools';
import { validateRedirect, normalisePath } from '@varka/seo';

type Redirection = {
  id: string;
  source: string;
  target: string;
  code: number;
  hits: number;
  active: boolean;
};

/** Rank Math-style Redirections manager. */
export function RedirectionsAdmin({ searchParams }: { searchParams?: Promise<{ source?: string }> }) {
  const [items, setItems] = useState<Redirection[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [code, setCode] = useState('301');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function add() {
    if (!source.trim() || !target.trim()) {
      setError('Source and target are required.');
      return;
    }
    // BMS validation: checks type, same source/target, etc.
    const validationError = validateRedirect({
      source: source.trim(),
      destination: target.trim(),
      type: Number(code),
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await createRedirectionAction({
        source: normalisePath(source.trim()),
        target: target.trim(),
        code: Number(code),
      });
      if (result.ok) {
        setSource('');
        setTarget('');
        await load();
      } else {
        setError(result.error || 'Failed to create.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create.');
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this redirection?')) return;
    await deleteRedirectionAction(id);
    await load();
  }

  async function toggle(id: string, active: boolean) {
    await toggleRedirectionAction(id, !active);
    await load();
  }

  return (
    <div>
      <div className="v-card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Add Redirection</h2>
        {error ? <p className="v-alert v-alert--error">{error}</p> : null}
        <div className="v-grid-3">
          <label>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Source URL</span>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="/old-path"
              style={{ width: '100%' }}
            />
          </label>
          <label>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Target URL</span>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="/new-path or https://…"
              style={{ width: '100%' }}
            />
          </label>
          <label>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Type</span>
            <select value={code} onChange={(e) => setCode(e.target.value)}>
              <option value="301">301 Permanent</option>
              <option value="302">302 Temporary</option>
              <option value="307">307 Temporary</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          className="v-btn v-btn--primary"
          onClick={() => void add()}
          disabled={saving}
          style={{ marginTop: 12 }}
        >
          {saving ? 'Adding…' : 'Add Redirection'}
        </button>
      </div>

      <div className="v-card">
        <h2 style={{ marginTop: 0 }}>Redirections ({items.length})</h2>
        {loading ? (
          <p className="v-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="v-muted">No redirections yet.</p>
        ) : (
          <div className="v-table-wrap">
          <table className="v-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Target</th>
                <th>Type</th>
                <th>Hits</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td><code>{r.source}</code></td>
                  <td><code>{r.target}</code></td>
                  <td>{r.code}</td>
                  <td>{r.hits}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={r.active}
                      onChange={() => void toggle(r.id, r.active)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="v-btn v-btn--small"
                      onClick={() => void remove(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
