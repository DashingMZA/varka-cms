'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const rate = await fetch('/api/auth/rate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (rate.status === 429) {
        const data = (await rate.json()) as { retryAfterSec?: number };
        setError(`Too many attempts. Retry in ${data.retryAfterSec ?? 60}s`);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!res.ok) {
        await fetch('/api/auth/rate-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, failed: true }),
        });
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? `Sign-in failed (${res.status})`);
        setLoading(false);
        return;
      }
      window.location.href = '/dashboard';
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        Email
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        Password
        <input
          type="password"
          required
          minLength={12}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
      </label>
      {error ? (
        <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <a href="/api/auth/sign-in/social?provider=google" style={oauthStyle}>
          Google
        </a>
        <a href="/api/auth/sign-in/social?provider=github" style={oauthStyle}>
          GitHub
        </a>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
        OAuth works only when client IDs are set in env. First owner: use Better Auth sign-up or seed
        + set password.
      </p>
    </form>
  );
}

const inputStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: '#fff',
};

const btnStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
};

const oauthStyle: CSSProperties = {
  flex: 1,
  textAlign: 'center',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  color: 'var(--ink)',
  fontSize: 13,
};
