'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useMessages } from '@/lib/i18n';
import { getSettingsAction, saveSettingsAction } from '@/actions/settings';

export type SettingsGroup =
  | 'general'
  | 'writing'
  | 'reading'
  | 'discussion'
  | 'media'
  | 'permalinks'
  | 'privacy'
  | 'users';

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
  const { t } = useMessages();
  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSettingsAction(group);
        if (!res.ok) throw new Error(res.error || t('errors', 'loadFailed'));
        const data = res.data as { settings?: Record<string, unknown> };
        if (!cancelled) {
          setValues({ ...defaults, ...data.settings });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t('errors', 'loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [group]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await saveSettingsAction(group, values);
      if (!res.ok) throw new Error(res.error || t('errors', 'saveFailed'));
      setMessage(t('settings', 'saved') || 'Settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors', 'saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="v-muted">{t('settings', 'loading') || 'Loading…'}</p>;
  }

  return (
    <div className="v-wrap">
      <form onSubmit={onSubmit}>
        <div className="v-page-header">
          <h1 className="v-page-title">{title}</h1>
        </div>
        {description ? <p className="v-page-desc">{description}</p> : null}

        {message ? (
          <div className="v-notice v-notice--success">
            <p>{message}</p>
          </div>
        ) : null}
        {error ? (
          <div className="v-notice v-notice--error" role="alert">
            <p>{error}</p>
          </div>
        ) : null}

        <div className="v-card" style={{ marginBottom: 20 }}>
          <table className="v-form-table form-table">
            <tbody>{children(values, set)}</tbody>
          </table>
        </div>

        <p className="submit" style={{ marginTop: 20 }}>
          <button type="submit" className="v-btn v-btn--primary" disabled={saving}>
            {saving
              ? t('common', 'saving') || 'Saving…'
              : t('settings', 'saveChanges') || 'Save Changes'}
          </button>
        </p>
      </form>
    </div>
  );
}

/** WordPress form-table row */
export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <tr>
      <th scope="row">
        <label>{label}</label>
      </th>
      <td>
        {children}
        {hint ? <p className="description">{hint}</p> : null}
      </td>
    </tr>
  );
}

export const inputStyle: React.CSSProperties = {
  maxWidth: '25em',
  width: '100%',
};

export const selectStyle: React.CSSProperties = {
  maxWidth: '25em',
};
