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
import {
  signInEmailAction,
  verifyTwoFactorAction,
} from '@/actions/auth';

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
      const res = await signInEmailAction(parsed.data.email, parsed.data.password);

      if (!res.ok) {
        if (res.code === 'EMAIL_NOT_VERIFIED') {
          setError(t('auth', 'emailNotVerified'));
        } else {
          setError(res.error || t('auth', 'invalidCredentials'));
        }
        setLoading(false);
        return;
      }

      if (res.twoFactorRedirect) {
        setStep('twoFactor');
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
      const res = await verifyTwoFactorAction(parsed.data.code);
      if (!res.ok) {
        setError(res.error || mapKey('otpInvalid'));
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
      className="v-login"
      style={{ maxWidth: 360, margin: '48px auto', display: 'grid', gap: 12 }}
    >
      <h1 style={{ margin: 0, fontSize: 22 }}>{t('auth', 'loginTitle')}</h1>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      {step === 'credentials' ? (
        <>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            {t('auth', 'email')}
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            />
            {fieldErrors.password ? (
              <span className="v-field-error">{fieldErrors.password}</span>
            ) : null}
          </label>
          <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
            {loading ? t('common', 'loading') : t('auth', 'signIn')}
          </button>
          <p style={{ margin: 0, fontSize: 13 }}>
            <Link href="/forgot-password">{t('auth', 'forgotPassword')}</Link>
          </p>
        </>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: 13, color: '#646970' }}>
            {t('auth', 'twoFactorHint')}
          </p>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            {t('auth', 'otpCode')}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            {fieldErrors.code ? (
              <span className="v-field-error">{fieldErrors.code}</span>
            ) : null}
          </label>
          <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
            {loading ? t('common', 'loading') : t('auth', 'verify')}
          </button>
          <button
            type="button"
            className="v-btn"
            onClick={() => {
              setStep('credentials');
              setOtp('');
              setError(null);
            }}
          >
            {t('common', 'back')}
          </button>
        </>
      )}

      <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#646970' }}>
        {t('common', 'language')}
        <select
          value={locale}
          onChange={(e) => onLocale(e.target.value as AppLocale)}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
