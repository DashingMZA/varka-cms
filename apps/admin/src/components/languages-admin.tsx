'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { listLanguagesAction, createLanguageAction, updateLanguageAction } from '@/actions/languages';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'language' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('language', key);
  if (!v || v === key || v.startsWith('language.')) return fallback;
  return v;
}

type Lang = {
  id: string;
  name: string;
  nativeName: string;
  locale: string;
  languageCode: string;
  script: string;
  direction: string;
  urlPrefix: string;
  enabled: boolean;
  defaultLanguage: boolean;
};

export function LanguagesAdmin() {
  const { t } = useMessages();
  const [items, setItems] = useState<Lang[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await listLanguagesAction();
    if (!result.ok) {
      setError(L(t, 'loadFailed', 'Load failed: {error}').replace('{error}', result.error));
      return;
    }
    setItems((result.data.items as Lang[]) ?? []);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleEnabled(lang: Lang) {
    setError(null);
    const result = await updateLanguageAction(lang.id, { enabled: !lang.enabled });
    if (!result.ok) {
      setError(L(t, 'updateFailed', 'Update failed: {error}').replace('{error}', result.error));
      return;
    }
    setMessage(
      (!lang.enabled
        ? L(t, 'langEnabled', '{locale} enabled')
        : L(t, 'langDisabled', '{locale} disabled')
      ).replace('{locale}', lang.locale),
    );
    await load();
  }

  async function addPunjabi() {
    setError(null);
    setMessage(null);
    const result = await createLanguageAction({
      name: 'Punjabi',
      nativeName: 'پنجابی',
      locale: 'pa',
      languageCode: 'pa',
      script: 'Arab',
      direction: 'rtl',
      urlPrefix: 'pa',
      enabled: true,
      defaultLanguage: false,
    });
    if (!result.ok) {
      setError(result.error ?? L(t, 'createFailed', 'Create failed'));
      return;
    }
    setMessage(L(t, 'punjabiAdded', 'Punjabi (pa) added — one language row + script field'));
    await load();
  }

  const hasPa = items.some((l) => l.locale === 'pa' || l.languageCode === 'pa');

  return (
    <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, maxWidth: 560 }}>
        {L(
          t,
          'description',
          'Default language is prefixless. Other languages use urlPrefix (e.g. /pa/post/slug). Punjabi is one language; script is a field, not a second row.',
        )}
      </p>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      {message ? <p style={{ color: '#15803d', margin: 0 }}>{message}</p> : null}
      {!hasPa ? (
        <button type="button" onClick={() => void addPunjabi()} style={btn}>
          {L(t, 'addPunjabi', 'Add Punjabi (pa · Arab script)')}
        </button>
      ) : null}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: 10 }}>{L(t, 'name', 'Name')}</th>
            <th style={{ padding: 10 }}>{L(t, 'locale', 'Locale')}</th>
            <th style={{ padding: 10 }}>{L(t, 'script', 'Script')}</th>
            <th style={{ padding: 10 }}>{L(t, 'prefix', 'Prefix')}</th>
            <th style={{ padding: 10 }}>{L(t, 'default', 'Default')}</th>
            <th style={{ padding: 10 }}>{L(t, 'enabled', 'Enabled')}</th>
            <th style={{ padding: 10 }} />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 16, color: 'var(--muted)' }}>
                {L(t, 'noLanguages', 'No languages — run seed.')}
              </td>
            </tr>
          ) : (
            items.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 10 }}>
                  {l.name} <span style={{ color: 'var(--muted)' }}>({l.nativeName})</span>
                </td>
                <td style={{ padding: 10, fontFamily: 'monospace', fontSize: 13 }}>{l.locale}</td>
                <td style={{ padding: 10 }}>{l.script}</td>
                <td style={{ padding: 10, fontFamily: 'monospace', fontSize: 13 }}>
                  {l.urlPrefix || '—'}
                </td>
                <td style={{ padding: 10 }}>{l.defaultLanguage ? L(t, 'yes', 'yes') : ''}</td>
                <td style={{ padding: 10 }}>
                  {l.enabled ? L(t, 'yes', 'yes') : L(t, 'no', 'no')}
                </td>
                <td style={{ padding: 10 }}>
                  <button type="button" style={btnMuted} onClick={() => void toggleEnabled(l)}>
                    {l.enabled ? L(t, 'disable', 'Disable') : L(t, 'enable', 'Enable')}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const btn: Record<string, string | number> = {
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
  width: 'fit-content',
};
const btnMuted: Record<string, string | number> = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: '#fff',
  fontSize: 12,
};
