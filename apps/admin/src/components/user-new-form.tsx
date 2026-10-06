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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [nickname, setNickname] = useState('');
  const [lastName, setLastName] = useState('');
  const [website, setWebsite] = useState('');
  const [password, setPassword] = useState('');
  const [roleSlug, setRoleSlug] = useState('author');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createUserAction({
      username,
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      website: website || undefined,
      roleSlug,
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
      <div className="v-card" style={{ maxWidth: 560 }}>
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      <label style={{ display: "block" }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{L(t, 'username', 'Username')}</span>
        <input required value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label style={{ display: "block" }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{L(t, 'email', 'Email')}</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label style={{ display: "block" }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{L(t, 'firstName', 'First name')} <span style={{color: '#d63638'}}>*</span></span>
        <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </label>
      <label style={{ display: "block" }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{L(t, 'lastName', 'Last name')} <span style={{color: '#d63638'}}>*</span></span>
        <input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </label>
      <label style={{ display: "block" }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{L(t, 'nickname', 'Nickname')} <span style={{color: '#d63638'}}>*</span></span>
        <input required value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </label>
      <label style={{ display: "block" }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{L(t, 'website', 'Website')}</span>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} />
      </label>
      <label>
        {L(t, 'password', 'Password')}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
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
      </label>
      <label>
        {L(t, 'role', 'Role')}
        <select value={roleSlug} onChange={(e) => setRoleSlug(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
        {loading ? L(t, 'creating', 'Creating…') : L(t, 'addNewUser', 'Add New User')}
      </button>
    </form>
      </div>
    </>
  );
}
