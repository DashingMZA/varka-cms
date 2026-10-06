'use client';

import { useEffect, useState } from 'react';
import { getMyProfileAction, updateColorSchemeAction } from '@/actions/users';
import { useMessages } from '@/lib/i18n';

const COLOR_SCHEMES = [
  { id: 'default', name: 'Default', colors: ['#1d2327', '#2271b1', '#72aee6'] },
  { id: 'fresh', name: 'Fresh', colors: ['#1d2327', '#0073aa', '#00a0d2'] },
  { id: 'light', name: 'Light', colors: ['#e5e5e5', '#888888', '#d64e07', '#04a4cc'] },
  { id: 'blue', name: 'Blue', colors: ['#52accc', '#096484', '#e1a948'] },
  { id: 'coffee', name: 'Coffee', colors: ['#59524c', '#c7a589', '#9ea476'] },
  { id: 'ectoplasm', name: 'Ectoplasm', colors: ['#523f6d', '#a3b745', '#d46f15'] },
  { id: 'midnight', name: 'Midnight', colors: ['#25282b', '#363b3f', '#69a8bb', '#e14d43'] },
  { id: 'ocean', name: 'Ocean', colors: ['#738e96', '#9ebaa0', '#aa9d88'] },
  { id: 'sunrise', name: 'Sunrise', colors: ['#cf4944', '#dd823b', '#ccaf0b'] },
];

function applyScheme(scheme: string) {
  document.documentElement.dataset.adminScheme = scheme;
  const vAdmin = document.querySelector('.v-admin');
  if (vAdmin) vAdmin.setAttribute('data-admin-scheme', scheme);
}

export function AdminColorScheme() {
  const { t } = useMessages();
  const [scheme, setScheme] = useState('default');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await getMyProfileAction();
      if (res.ok) {
        const p = res.data as { adminColorScheme?: string | null };
        setScheme(p.adminColorScheme ?? 'default');
      }
    })();
  }, []);

  async function select(id: string) {
    setScheme(id);
    applyScheme(id); // live preview
    setSaving(true);
    const res = await updateColorSchemeAction(id);
    setSaving(false);
    if (!res.ok) {
      // revert on failure - refetch
      const r = await getMyProfileAction();
      if (r.ok) {
        const p = r.data as { adminColorScheme?: string | null };
        const prev = p.adminColorScheme ?? 'default';
        setScheme(prev);
        applyScheme(prev);
      }
    }
  }

  return (
    <div className="v-card">
      <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>
        {t('profile', 'adminColorScheme') !== 'profile.adminColorScheme'
          ? t('profile', 'adminColorScheme')
          : 'Admin Color Scheme'}
        {saving ? <span className="v-muted" style={{ fontSize: 12 }}> — saving…</span> : null}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
        {COLOR_SCHEMES.map((s) => (
          <label
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: 8,
              border: scheme === s.id ? '2px solid var(--wp-accent)' : '1px solid #ddd',
              borderRadius: 6,
            }}
          >
            <input
              type="radio"
              name="admin-color-scheme"
              value={s.id}
              checked={scheme === s.id}
              onChange={() => select(s.id)}
            />
            <span>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>{s.name}</span>
              <span style={{ display: 'flex' }}>
                {s.colors.map((c, i) => (
                  <span key={i} style={{ width: 18, height: 14, background: c, display: 'inline-block' }} />
                ))}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
