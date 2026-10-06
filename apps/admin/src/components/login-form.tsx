'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  setStoredLocale,
  useMessages,
  SUPPORTED_LOCALES,
} from '@/lib/i18n';
import { useServerLocale } from '@/lib/locale-provider';
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

/** Inline SVG eye icons (no extra dependency). */
function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <path d="M2 2l20 20" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function LoginForm({
  serverError,
  initialStep,
}: {
  serverError?: string | null;
  initialStep?: Step;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>(initialStep ?? 'credentials');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const serverLocale = useServerLocale();
  const [locale, setLocale] = useState<AppLocale>(serverLocale);
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
      const res = await signInEmailAction(parsed.data.email, parsed.data.password, remember);
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
    <div className="v-login-modern">
      <h1 className="v-login-brand">VARKA</h1>
      <h2 className="v-login-title">{t('auth', 'welcomeBack')}</h2>
      <p className="v-login-subtitle">{t('auth', 'signInSubtitle')}</p>

      <form
        className="v-login-form-modern"
        // Native POST fallback: if client JS/hydration fails, the browser still
        // logs in via /api/auth/login instead of a useless GET to /login.
        action="/api/auth/login"
        method="post"
        onSubmit={step === 'credentials' ? onSubmitCredentials : onSubmitTwoFactor}
      >
        {step === 'twoFactor' ? (
          <>
            <h3 className="v-login-2fa-title">{t('auth', 'twoFactorTitle')}</h3>
            <p className="v-login-2fa-hint">{t('auth', 'twoFactorHint')}</p>
            <label className="v-login-field">
              <span className="v-login-field-label">{t('auth', 'verifyCode')}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
              />
              {fieldErrors.code ? <span className="v-field-error">{fieldErrors.code}</span> : null}
            </label>
          </>
        ) : (
          <>
            <label className="v-login-field">
              <span className="v-login-field-label">{t('auth', 'email')}</span>
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

            <div className="v-login-field">
              <div className="v-login-field-row">
                <span className="v-login-field-label">{t('auth', 'password')}</span>
                <Link href="/forgot-password" className="v-login-forgot">
                  {t('auth', 'forgotPassword')}
                </Link>
              </div>
              <div className="v-login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth', 'passwordPlaceholder')}
                  aria-label={t('auth', 'password')}
                />
                <button
                  type="button"
                  className="v-login-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth', 'hidePassword') : t('auth', 'showPassword')}
                  title={showPassword ? t('auth', 'hidePassword') : t('auth', 'showPassword')}
                  tabIndex={-1}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
              {fieldErrors.password ? (
                <span className="v-field-error">{fieldErrors.password}</span>
              ) : null}
            </div>

            <label className="v-login-remember">
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>{t('auth', 'rememberMe')}</span>
            </label>
          </>
        )}

        {error ? <p className="v-login-error-modern">{error}</p> : null}
        {!error && serverErrorMessage ? (
          <p className="v-login-error-modern">{serverErrorMessage}</p>
        ) : null}

        <button type="submit" className="v-login-submit-modern" disabled={loading}>
          {loading
            ? t('auth', 'signingIn')
            : step === 'twoFactor'
              ? t('auth', 'twoFactorSubmit')
              : t('auth', 'login')}
        </button>

        {step === 'twoFactor' ? (
          <button
            type="button"
            className="v-login-back-btn"
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

      <div className="v-login-footer">
        <label className="v-login-lang">
          <span>{t('common', 'language')}</span>
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
        <p className="v-login-back-link">
          <a href={process.env.NEXT_PUBLIC_SITE_URL || '/'}>← {t('common', 'backToSite')}</a>
        </p>
      </div>
    </div>
  );
}
