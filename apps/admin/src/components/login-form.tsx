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
import { signInEmailAction, verifyTwoFactorAction } from '@/actions/auth';

type Step = 'credentials' | 'twoFactor';

const SERVER_ERRORS: Record<string, string> = {
  invalid: 'invalidCredentials',
  missing: 'missingCredentials',
  locked: 'accountLocked',
  unverified: 'emailNotVerified',
};

export function LoginForm({
  serverError,
  initialStep,
}: {
  serverError?: string | null;
  initialStep?: Step;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>(initialStep ?? 'credentials');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [locale, setLocale] = useState(getStoredLocale);
  const { t } = useMessages(locale);

  function mapKey(key: string): string {
    return t('validation', key) || t('auth', key) || key;
  }

  const serverErrorMessage =
    serverError && SERVER_ERRORS[serverError]
      ? t('auth', SERVER_ERRORS[serverError])
      : null;

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
        if (res.code === 'EMAIL_NOT_VERIFIED') setError(t('auth', 'emailNotVerified'));
        else setError(res.error || t('auth', 'invalidCredentials'));
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
        setError(res.error || t('auth', 'invalidOtp'));
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
      className="v-login-form"
      // Native POST fallback: if client JS/hydration fails, the browser still
      // logs in via /api/auth/login instead of a useless GET to /login.
      action="/api/auth/login"
      method="post"
      onSubmit={step === 'credentials' ? onSubmitCredentials : onSubmitTwoFactor}
    >
      {step === 'twoFactor' ? (
        <>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {t('auth', 'twoFactorTitle')}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#646970' }}>{t('auth', 'twoFactorHint')}</p>
        </>
      ) : null}

      <label className="v-login-label">
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
          <label className="v-login-label">
            {t('auth', 'email')}
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth', 'emailPlaceholder')}
            />
            {fieldErrors.email ? <span className="v-field-error">{fieldErrors.email}</span> : null}
          </label>
          <label className="v-login-label">
            {t('auth', 'password')}
            <input
              type="password"
              name="password"
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
        <label className="v-login-label">
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

      {error ? <p className="v-login-error">{error}</p> : null}
      {!error && serverErrorMessage ? (
        <p className="v-login-error">{serverErrorMessage}</p>
      ) : null}

      <button type="submit" className="v-btn v-btn--primary v-login-submit" disabled={loading}>
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
