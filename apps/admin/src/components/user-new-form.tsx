'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { listRolesAction, createUserAction } from '@/actions/users';
import { useMessages } from '@/lib/i18n';

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

type Role = { slug: string; name: string };

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [website, setWebsite] = useState('');
  const [password, setPassword] = useState('');
  const [roleSlug, setRoleSlug] = useState('author');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listRolesAction().then((res) => {
      if (res.ok) {
        const list = (res.data.roles as Role[]) ?? [];
        setRoles(list);
        if (list.length && !list.some((r) => r.slug === roleSlug)) {
          setRoleSlug(list[0]!.slug);
        }
      }
    });
  }, [roleSlug]);

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
    <form onSubmit={onSubmit} style={{ maxWidth: 480, display: 'grid', gap: 12 }}>
      <h1 className="v-page-title" style={{ margin: 0 }}>
        {L(t, 'addNewUser', 'Add New User')}
      </h1>
      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      <label>
        {L(t, 'username', 'Username')}
        <input required value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        {L(t, 'email', 'Email')}
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        {L(t, 'firstName', 'First name')}
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </label>
      <label>
        {L(t, 'lastName', 'Last name')}
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </label>
      <label>
        {L(t, 'website', 'Website')}
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
          {roles.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
        {loading ? L(t, 'creating', 'Creating…') : L(t, 'addNewUser', 'Add New User')}
      </button>
    </form>
  );
}
