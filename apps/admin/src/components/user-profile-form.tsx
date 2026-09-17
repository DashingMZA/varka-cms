'use client';

import { useEffect, useState, type FormEvent } from 'react';

const SCHEMES: { id: string; label: string; colors: string[] }[] = [
  { id: 'default', label: 'Default', colors: ['#1d2327', '#2271b1', '#72aee6'] },
  { id: 'light', label: 'Light', colors: ['#e5e5e5', '#999', '#d54e21', '#04a4cc'] },
  { id: 'blue', label: 'Blue', colors: ['#52accc', '#e1eef5', '#096484', '#e1a948'] },
  { id: 'coffee', label: 'Coffee', colors: ['#46403c', '#c7a589', '#9b8a7a', '#baa186'] },
  { id: 'ectoplasm', label: 'Ectoplasm', colors: ['#523f6d', '#a3b745', '#d36b00', '#523f6d'] },
  { id: 'midnight', label: 'Midnight', colors: ['#26292c', '#69a8bb', '#e14d43', '#26292c'] },
  { id: 'ocean', label: 'Ocean', colors: ['#627c83', '#9ebaa0', '#aa9d88', '#738e96'] },
  { id: 'sunrise', label: 'Sunrise', colors: ['#b43c38', '#cf4944', '#dd823b', '#f2cf43'] },
];

type Profile = {
  id: string;
  name: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  website?: string | null;
  bio?: string | null;
  adminColorScheme?: string;
};

export function UserProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load profile');
        setProfile((await res.json()) as Profile);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!profile?.adminColorScheme) return;
    document.documentElement.setAttribute('data-admin-scheme', profile.adminColorScheme);
  }, [profile?.adminColorScheme]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          nickname: profile.nickname ?? '',
          website: profile.website ?? '',
          bio: profile.bio ?? '',
          email: profile.email,
          adminColorScheme: profile.adminColorScheme ?? 'default',
          ...(newPassword ? { newPassword, currentPassword: currentPassword || undefined } : {}),
        }),
      });
      const body = (await res.json()) as Profile & { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Save failed');
      setProfile(body);
      setNewPassword('');
      setCurrentPassword('');
      setMessage('Profile updated.');
      document.documentElement.setAttribute('data-admin-scheme', body.adminColorScheme || 'default');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="v-muted">Loading profile…</p>;
  if (!profile) return <p className="v-alert v-alert--error">{error ?? 'No profile'}</p>;

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 640 }}>
      <h1 className="v-page-title">Profile</h1>
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <h2 style={{ fontSize: 15, marginTop: 20 }}>Administration Color Scheme</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {SCHEMES.map((s) => (
          <label
            key={s.id}
            style={{
              display: 'grid',
              gap: 4,
              padding: 8,
              borderRadius: 4,
              border: profile.adminColorScheme === s.id ? '2px solid var(--wp-accent)' : '1px solid var(--wp-border)',
              cursor: 'pointer',
              background: profile.adminColorScheme === s.id ? '#f0f6fc' : '#fff',
            }}
          >
            <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <input
                type="radio"
                name="adminColorScheme"
                checked={(profile.adminColorScheme || 'default') === s.id}
                onChange={() => setProfile({ ...profile, adminColorScheme: s.id })}
              />
              {s.label}
            </span>
            <span style={{ display: 'flex', height: 12, borderRadius: 2, overflow: 'hidden' }}>
              {s.colors.map((c) => (
                <span key={c} style={{ flex: 1, background: c }} />
              ))}
            </span>
          </label>
        ))}
      </div>
      <p className="v-muted" style={{ fontSize: 12 }}>Each user can pick their own dashboard theme.</p>

      <h2 style={{ fontSize: 15, marginTop: 20 }}>Name</h2>
      <label style={field}>Username<input value={profile.nickname || ''} disabled style={{ ...input, opacity: 0.7 }} /></label>
      <label style={field}>First Name<input value={profile.firstName || ''} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} style={input} /></label>
      <label style={field}>Last Name<input value={profile.lastName || ''} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} style={input} /></label>
      <label style={field}>Nickname (required)<input required value={profile.nickname || ''} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} style={input} /></label>

      <h2 style={{ fontSize: 15, marginTop: 20 }}>Contact</h2>
      <label style={field}>Email<input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} style={input} /></label>
      <label style={field}>Website<input value={profile.website || ''} onChange={(e) => setProfile({ ...profile, website: e.target.value })} style={input} /></label>
      <label style={field}>Bio<textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={4} style={{ ...input, maxWidth: 480 }} /></label>

      <h2 style={{ fontSize: 15, marginTop: 20 }}>Password</h2>
      <label style={field}>Current password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={input} /></label>
      <label style={field}>New password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={input} minLength={12} placeholder="Leave blank to keep" /></label>

      <button type="submit" className="v-btn v-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Update Profile'}</button>
    </form>
  );
}

const field: React.CSSProperties = { display: 'grid', gap: 6, marginBottom: 12, fontSize: 13, fontWeight: 600 };
const input: React.CSSProperties = { fontWeight: 400, padding: '8px 10px', border: '1px solid var(--wp-border, #c3c4c7)', borderRadius: 4, maxWidth: 360, width: '100%' };
