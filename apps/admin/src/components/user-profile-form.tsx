'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { getMyProfileAction, updateMyProfileAction } from '@/actions/users';
import { useMessages } from '@/lib/i18n';

function L(t: (ns: 'profile' | 'common', key: string) => string, key: string, fallback: string): string {
  const v = t('profile', key);
  if (!v || v === key || v.startsWith('profile.')) return fallback;
  return v;
}

type Profile = {
  id: string;
  name?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  website?: string | null;
  bio?: string | null;
  adminColorScheme?: string | null;
};

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

export function UserProfileForm() {
  const { t } = useMessages();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [colorScheme, setColorScheme] = useState('default');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await getMyProfileAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const p = res.data as Profile;
      setProfile(p);
      setFirstName(p.firstName ?? '');
      setLastName(p.lastName ?? '');
      setNickname(p.nickname ?? '');
      setWebsite(p.website ?? '');
      setBio(p.bio ?? '');
      setEmail(p.email ?? '');
      setName(p.name ?? '');
      setColorScheme(p.adminColorScheme ?? 'default');
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const res = await updateMyProfileAction({
      firstName,
      lastName,
      nickname,
      website,
      bio,
      email,
      name,
      adminColorScheme: colorScheme,
      ...(newPassword
        ? { newPassword, currentPassword }
        : {}),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(L(t, 'profileUpdated', 'Profile updated'));
    setCurrentPassword('');
    setNewPassword('');
    // Apply the new color scheme immediately without a full page reload
    document.documentElement.dataset.adminScheme = colorScheme;
    const vAdmin = document.querySelector('.v-admin');
    if (vAdmin) vAdmin.setAttribute('data-admin-scheme', colorScheme);
  }

  // Apply color scheme live on selection (preview), saved on submit
  function handleSchemeChange(value: string) {
    setColorScheme(value);
    document.documentElement.dataset.adminScheme = value;
    const vAdmin = document.querySelector('.v-admin');
    if (vAdmin) vAdmin.setAttribute('data-admin-scheme', value);
  }

  if (!profile && !error) return <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>;

  return (
      <div className="v-card">
    <form onSubmit={onSubmit} className="v-form">
      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      <div className="v-field">
        <label htmlFor="pf-name">{L(t, 'displayName', 'Display name')}</label>
        <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="pf-first">{L(t, 'firstName', 'First name')}</label>
        <input id="pf-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="pf-last">{L(t, 'lastName', 'Last name')}</label>
        <input id="pf-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="pf-nick">{L(t, 'nickname', 'Nickname')}</label>
        <input id="pf-nick" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="pf-email">{L(t, 'email', 'Email')}</label>
        <input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="pf-web">{L(t, 'website', 'Website')}</label>
        <input id="pf-web" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="pf-bio">{L(t, 'bio', 'Bio')}</label>
        <textarea id="pf-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
      </div>

      <h2 style={{ margin: '12px 0 0', fontSize: 16 }}>
        {L(t, 'adminColorScheme', 'Administration Color Scheme')}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {COLOR_SCHEMES.map((scheme) => (
          <label
            key={scheme.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: 8,
              border: colorScheme === scheme.id ? '2px solid var(--wp-accent)' : '1px solid #ddd',
              borderRadius: 4,
            }}
          >
            <input
              type="radio"
              name="colorScheme"
              value={scheme.id}
              checked={colorScheme === scheme.id}
              onChange={(e) => handleSchemeChange(e.target.value)}
              />
            <span>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>{scheme.name}</span>
              <span style={{ display: 'flex', gap: 0 }}>
                {scheme.colors.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: 20,
                      height: 16,
                      background: c,
                      display: 'inline-block',
                    }}
                  />
                ))}
              </span>
            </span>
          </label>
        ))}
      </div>

      <h2 style={{ margin: '12px 0 0', fontSize: 16 }}>{L(t, 'changePassword', 'Change password')}</h2>
      <div className="v-field">
        <label htmlFor="pf-curpass">{L(t, 'currentPassword', 'Current password')}</label>
        <input
          id="pf-curpass"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          />
      </div>
      <div className="v-field">
        <label htmlFor="pf-newpass">{L(t, 'newPassword', 'New password')}</label>
        <input
          id="pf-newpass"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          />
      </div>

      <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
        {loading ? L(t, 'saving', 'Saving…') : L(t, 'updateProfile', 'Update Profile')}
      </button>
    </form>
      </div>
  );
}
