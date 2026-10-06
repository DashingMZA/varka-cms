'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createUserAction } from '@/actions/users';
import { useMessages } from '@/lib/i18n';
import { ROLES } from '@varka/permissions';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'users' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('users', key);
  if (!v || v === key || v.startsWith('users.')) return fallback;
  return v;
}

function generatePassword(len = 20): string {
  const chars =
    'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

export function UserNewForm() {
  const { t } = useMessages();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [nickname, setNickname] = useState('');
  const [lastName, setLastName] = useState('');
  const [website, setWebsite] = useState('');
  const [password, setPassword] = useState('');
  const [roleSlug, setRoleSlug] = useState('author');
  const [sendNotification, setSendNotification] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Use email prefix as username (username field removed)
    const username = email.split('@')[0] || nickname;
    const res = await createUserAction({
      username,
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      nickname: nickname || undefined,
      website: website || undefined,
      roleSlug,
      sendNotification,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push('/users');
  }

  return (
    <>
      <h1 className="v-page-title" style={{ margin: '0 0 16px' }}>
        {L(t, 'addNewUser', 'Add New User')}
      </h1>
      <div className="v-card" style={{ maxWidth: 720 }}>
    <form onSubmit={onSubmit} className="v-form v-form--horizontal">
      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      <div className="v-field">
        <label htmlFor="nu-email">{L(t, 'email', 'Email')} <span style={{color: '#d63638'}}>*</span></label>
        <input id="nu-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="nu-first">{L(t, 'firstName', 'First name')} <span style={{color: '#d63638'}}>*</span></label>
        <input id="nu-first" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="nu-last">{L(t, 'lastName', 'Last name')} <span style={{color: '#d63638'}}>*</span></label>
        <input id="nu-last" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="nu-nick">{L(t, 'nickname', 'Nickname')} <span style={{color: '#d63638'}}>*</span></label>
        <input id="nu-nick" required value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="nu-web">{L(t, 'website', 'Website')}</label>
        <input id="nu-web" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="nu-pass">{L(t, 'password', 'Password')} <span style={{color: '#d63638'}}>*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="nu-pass"
            type="text"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" className="v-btn" onClick={() => setPassword(generatePassword())}>
            {L(t, 'generate', 'Generate')}
          </button>
        </div>
      </div>
      <div className="v-field">
        <label>Send User Notification</label>
        <div style={{ paddingTop: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              style={{ margin: 0 }}
            />
            Send the new user an email about their account
          </label>
        </div>
      </div>
      <div className="v-field">
        <label htmlFor="nu-role">{L(t, 'role', 'Role')}</label>
        <select id="nu-role" value={roleSlug} onChange={(e) => setRoleSlug(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="v-field">
        <span></span>
        <button type="submit" className="v-btn v-btn--primary" disabled={loading} style={{ justifySelf: 'start' }}>
          {loading ? L(t, 'creating', 'Creating…') : L(t, 'addNewUser', 'Add New User')}
        </button>
      </div>
    </form>
      </div>
    </>
  );
}
