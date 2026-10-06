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
};

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
