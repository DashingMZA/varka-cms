'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  getStoredLocale,
  setStoredLocale,
  useMessages,
  SUPPORTED_LOCALES,
} from '@/lib/i18n';
import type { AppLocale } from '@varka/i18n';
import { loginSchema, twoFactorCodeSchema, zodErrorKeys } from '@varka/validation';

type Step = 'credentials' | 'twoFactor';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [locale, setLocale] = useState(getStoredLocale);
  const { t } = useMessages(locale);

  function mapKey(key: string): string {
    return t('validation', key) || t('auth', key) || key;
  }

  async function onSubmitCredentials(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const keys = zodErrorKeys(parsed.error);
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(keys)) mapped[k] = mapKey(v);
      setFieldErrors(mapped);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
        credentials: 'include',
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        twoFactorRedirect?: boolean;
        code?: string;
      };

      if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
        setError(t('auth', 'emailNotVerified'));
        setLoading(false);
        return;
      }

      if (
        res.ok &&
        (data.twoFactorRedirect === true ||
          (typeof data.message === 'string' &&
            data.message.toLowerCase().includes('two factor')))
      ) {
        setStep('twoFactor');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        if (res.status === 401 && data.twoFactorRedirect) {
          setStep('twoFactor');
          setLoading(false);
          return;
        }
        setError(data.message ?? t('auth', 'invalidCredentials'));
        setLoading(false);
        return;
      }

      window.location.assign('/dashboard');
    } catch {
      setError(t('auth', 'networkError'));
      setLoading(false);
    }
  }

  async function onSubmitTwoFactor(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = twoFactorCodeSchema.safeParse({ code: otp });
    if (!parsed.success) {
      const keys = zodErrorKeys(parsed.error);
      setFieldErrors({ code: mapKey(keys.code || 'otpLength') });
      return;
    }

    setLoading(true);
    try {
      let res = await fetch('/api/auth/two-factor/verify-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ code: parsed.data.code }),
        credentials: 'include',
      });

      if (!res.ok) {
        res = await fetch('/api/auth/two-factor/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: window.location.origin,
          },
          body: JSON.stringify({ code: parsed.data.code }),
          credentials: 'include',
        });
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? mapKey('otpInvalid'));
        setLoading(false);
        return;
      }

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
      onSubmit={step === 'credentials' ? onSubmitCredentials : onSubmitTwoFactor}
      style={{ maxWidth: 360, margin: '48px auto', display: 'grid', gap: 12 }}
    >
      <h1 style={{ margin: 0, fontSize: 22 }}>
        {step === 'twoFactor' ? t('auth', 'twoFactorTitle') : t('auth', 'signInTitle')}
      </h1>
      {step === 'twoFactor' ? (
        <p style={{ margin: 0, fontSize: 13, color: '#646970' }}>{t('auth', 'twoFactorHint')}</p>
      ) : null}

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

      {step === 'credentials' ? (
        <>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            {t('auth', 'email')}
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth', 'emailPlaceholder')}
            />
            {fieldErrors.email ? (
              <span className="v-field-error">{fieldErrors.email}</span>
            ) : null}
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            {t('auth', 'password')}
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth', 'passwordPlaceholder')}
            />
            {fieldErrors.password ? (
              <span className="v-field-error">{fieldErrors.password}</span>
            ) : null}
          </label>
          <p style={{ margin: 0, fontSize: 13 }}>
            <Link href="/forgot-password">{t('auth', 'forgotPassword')}</Link>
          </p>
        </>
      ) : (
        <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          {t('auth', 'verifyCode')}
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          {fieldErrors.code ? <span className="v-field-error">{fieldErrors.code}</span> : null}
        </label>
      )}

      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
        {loading
          ? t('auth', 'signingIn')
          : step === 'twoFactor'
            ? t('auth', 'twoFactorSubmit')
            : t('auth', 'login')}
      </button>

      {step === 'twoFactor' ? (
        <button
          type="button"
          className="v-btn"
          onClick={() => {
            setStep('credentials');
            setOtp('');
            setError(null);
          }}
        >
          {t('auth', 'signIn')}
        </button>
      ) : null}
    </form>
  );
}
