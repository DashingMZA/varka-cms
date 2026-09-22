'use client';

import { useState, type FormEvent } from 'react';
import { getStoredLocale, setStoredLocale, useMessages, SUPPORTED_LOCALES } from '@/lib/i18n';
import type { AppLocale } from '@varka/i18n';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locale, setLocale] = useState(getStoredLocale);
  const { t } = useMessages(locale);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const emailNorm = email.trim().toLowerCase();
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ email: emailNorm, password }),
        credentials: 'include',
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        user?: { id?: string };
      };

      if (!res.ok) {
        setError(data.message ?? t('auth', 'invalidCredentials'));
        setLoading(false);
        return;
      }

      // Hard navigation so App Router does not reuse a cached 307→/login
      window.location.assign('/dashboard');
    } catch {
      setError(t('auth', 'networkError'));
      setLoading(false);
    }
  }

  function onLocale(next: AppLocale) {
    setStoredLocale(next);
    setLocale(next);
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ maxWidth: 360, margin: '48px auto', display: 'grid', gap: 12 }}
    >
      <h1 style={{ margin: 0, fontSize: 22 }}>{t('auth', 'signInTitle')}</h1>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        {t('common', 'language')}
        <select
          value={locale}
          onChange={(e) => onLocale(e.target.value as AppLocale)}
          aria-label={t('common', 'language')}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        {t('auth', 'email')}
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        {t('auth', 'password')}
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
        {loading ? t('auth', 'signingIn') : t('auth', 'login')}
      </button>
    </form>
  );
}
