'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';

export type SettingsGroup =
  | 'general'
  | 'writing'
  | 'reading'
  | 'discussion'
  | 'media'
  | 'permalinks';

type Props = {
  group: SettingsGroup;
  title: string;
  description?: string;
  defaults: Record<string, unknown>;
  children: (
    values: Record<string, unknown>,
    set: (key: string, value: unknown) => void,
  ) => ReactNode;
};

export function SettingsForm({ group, title, description, defaults, children }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/settings?group=${group}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load settings');
        const data = (await res.json()) as { settings?: Record<string, unknown> };
        if (!cancelled) {
          setValues({ ...defaults, ...(data.settings ?? {}) });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [group]);

  const set = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/settings?group=${group}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      setMessage('Settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--muted)' }}>Loading settings…</p>;
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 720 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>{title}</h1>
        {description ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{description}</p>
        ) : null}
      </header>
      <div style={{ display: 'grid', gap: 20 }}>{children(values, set)}</div>
      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '10px 18px',
            borderRadius: 6,
            border: 'none',
            background: 'var(--accent, #2271b1)',
            color: '#fff',
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {message ? <span style={{ color: 'green', fontSize: 13 }}>{message}</span> : null}
        {error ? (
          <span role="alert" style={{ color: 'var(--danger, #b32d2e)', fontSize: 13 }}>
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label style={{ fontWeight: 600, fontSize: 13 }}>{label}</label>
      {children}
      {hint ? <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{hint}</p> : null}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 4,
  border: '1px solid var(--border, #8c8f94)',
  fontSize: 14,
  maxWidth: 400,
  width: '100%',
  background: '#fff',
};

export const selectStyle: React.CSSProperties = { ...inputStyle, maxWidth: 280 };
