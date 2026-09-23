'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMessages } from '@/lib/i18n';
import { forgotPasswordSchema, zodErrorKeys } from '@varka/validation';

export function ForgotPasswordForm() {
  const { t } = useMessages();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function mapKey(key: string): string {
    return t('validation', key) || key;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      const keys = zodErrorKeys(parsed.error);
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(keys)) mapped[k] = mapKey(v);
      setFieldErrors(mapped);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          email: parsed.data.email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        credentials: 'include',
      });
      if (!res.ok && res.status >= 500) {
        setError(t('auth', 'networkError'));
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError(t('auth', 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ maxWidth: 360, margin: '48px auto', display: 'grid', gap: 12 }}
    >
      <h1 style={{ margin: 0, fontSize: 22 }}>{t('auth', 'forgotTitle')}</h1>
      <p style={{ margin: 0, fontSize: 13, color: '#646970' }}>{t('auth', 'forgotHint')}</p>
      {done ? (
        <p className="v-alert v-alert--success">{t('auth', 'codeSent')}</p>
      ) : (
        <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          {t('auth', 'email')}
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldErrors.email ? <span className="v-field-error">{fieldErrors.email}</span> : null}
        </label>
      )}
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {!done ? (
        <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
          {loading ? t('auth', 'signingIn') : t('auth', 'forgotSubmit')}
        </button>
      ) : null}
      <p style={{ margin: 0, fontSize: 13 }}>
        <Link href="/login">{t('auth', 'signIn')}</Link>
      </p>
    </form>
  );
}
