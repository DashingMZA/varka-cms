'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Role = { slug: string; name: string };

function generatePassword(len = 20): string {
  const chars =
    'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

function strengthLabel(pw: string): { label: string; color: string } {
  if (pw.length < 12) return { label: 'Weak', color: '#d63638' };
  if (pw.length < 16) return { label: 'Medium', color: '#dba617' };
  return { label: 'Strong', color: '#00a32a' };
}

export function UserNewForm() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [website, setWebsite] = useState('');
  const [password, setPassword] = useState(() => generatePassword());
  const [showPw, setShowPw] = useState(true);
  const [roleSlug, setRoleSlug] = useState('reader');
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/users?roles=1', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { roles?: Role[] }) => {
        const list = d.roles ?? [];
        setRoles(list);
        if (list.some((r) => r.slug === 'author')) setRoleSlug('author');
        else if (list[0]) setRoleSlug(list[0].slug);
      })
      .catch(() => undefined);
  }, []);

  const strength = strengthLabel(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          firstName,
          lastName,
          website,
          roleSlug,
          sendNotification: notify,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Create failed');
      router.push('/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 520 }}>
      <p className="v-page-desc">Create a brand new user and add them to this site.</p>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      <label style={field}>
        <span>Username (required)</span>
        <input required value={username} onChange={(e) => setUsername(e.target.value)} style={input} />
      </label>
      <label style={field}>
        <span>Email (required)</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
      </label>
      <label style={field}>
        <span>First Name</span>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={input} />
      </label>
      <label style={field}>
        <span>Last Name</span>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={input} />
      </label>
      <label style={field}>
        <span>Website</span>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} style={input} />
      </label>
      <div style={field}>
        <span>Password</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="v-btn" onClick={() => { setPassword(generatePassword()); setShowPw(true); }}>
            Generate password
          </button>
          <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...input, maxWidth: 280 }} required minLength={12} />
          <button type="button" className="v-btn" onClick={() => setShowPw((v) => !v)}>{showPw ? 'Hide' : 'Show'}</button>
        </div>
        <div style={{ marginTop: 6, height: 22, borderRadius: 4, background: strength.color, color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 280 }}>
          {strength.label}
        </div>
      </div>
      <label style={{ ...field, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        <span>Send the new user an email about their account</span>
      </label>
      <label style={field}>
        <span>Role</span>
        <select value={roleSlug} onChange={(e) => setRoleSlug(e.target.value)} style={input}>
          {roles.map((r) => (
            <option key={r.slug} value={r.slug}>{r.name}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="v-btn v-btn--primary" disabled={saving}>
        {saving ? 'Adding…' : 'Add User'}
      </button>
    </form>
  );
}

const field: React.CSSProperties = { display: 'grid', gap: 6, marginBottom: 14, fontSize: 13, fontWeight: 600 };
const input: React.CSSProperties = { fontWeight: 400, padding: '8px 10px', border: '1px solid var(--wp-border, #c3c4c7)', borderRadius: 4, maxWidth: 360, width: '100%' };
