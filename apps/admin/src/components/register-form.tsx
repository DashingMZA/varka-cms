'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  setStoredLocale,
  useMessages,
} from '@/lib/i18n';
import { useServerLocale } from '@/lib/locale-provider';
import type { AppLocale } from '@varka/i18n';
import { AuthHeader } from '@/components/auth-header';
import { registerSchema, zodErrorKeys } from '@varka/validation';
import { signUpEmailAction } from '@/actions/auth';

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

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const serverLocale = useServerLocale();
  const [locale, setLocale] = useState<AppLocale>(serverLocale);
  const { t } = useMessages(locale);

  function mapKey(key: string): string {
    return t('validation', key) || t('auth', key) || key;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const parsed = registerSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      password,
      passwordConfirm: password,
    });
    if (!parsed.success) {
      const keys = zodErrorKeys(parsed.error);
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(keys)) mapped[k] = mapKey(v);
      setFieldErrors(mapped);
      return;
    }
    setLoading(true);
    try {
      const res = await signUpEmailAction(
        parsed.data.name,
        parsed.data.email,
        parsed.data.password,
      );
      if (!res.ok) {
        if (res.code === 'REGISTRATION_DISABLED') {
          setError(t('auth', 'registrationDisabled'));
        } else {
          setError(res.error || t('auth', 'registrationFailed'));
        }
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError(t('auth', 'networkError'));
      setLoading(false);
    }
  }

  function onLocale(next: AppLocale) {
    setStoredLocale(next);
    setLocale(next);
  }

  if (done) {
    return (
      <div className="v-login-modern">
        <h1 className="v-login-brand">VARKA</h1>
        <h2 className="v-login-title">{t('auth', 'registerSuccessTitle')}</h2>
        <p className="v-login-success-modern">{t('auth', 'registerSuccessMessage')}</p>
        <p className="v-login-return">
          <Link href="/login">{t('auth', 'signIn')}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="v-login-modern">
      <AuthHeader locale={locale} onLocale={onLocale} />
      <h2 className="v-login-title">{t('auth', 'registerTitle')}</h2>
      <p className="v-login-subtitle">{t('auth', 'registerSubtitle')}</p>

      <form className="v-login-form-modern" onSubmit={onSubmit}>
        <label className="v-login-field">
          <span className="v-login-field-label">{t('auth', 'fullName')}</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('auth', 'fullNamePlaceholder')}
            maxLength={120}
          />
          {fieldErrors.name ? <span className="v-field-error">{fieldErrors.name}</span> : null}
        </label>

        <label className="v-login-field">
          <span className="v-login-field-label">{t('auth', 'email')}</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth', 'emailPlaceholder')}
          />
          {fieldErrors.email ? <span className="v-field-error">{fieldErrors.email}</span> : null}
        </label>

        <div className="v-login-field">
          <span className="v-login-field-label">{t('auth', 'password')}</span>
          <div className="v-login-password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth', 'passwordPlaceholder')}
              aria-label={t('auth', 'password')}
              minLength={12}
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
          <p className="v-login-hint">{t('auth', 'passwordHint')}</p>
        </div>

        {error ? <p className="v-login-error-modern">{error}</p> : null}

        <button type="submit" className="v-login-submit-modern" disabled={loading}>
          {loading ? t('auth', 'registering') : t('auth', 'register')}
        </button>
      </form>

      <p className="v-login-return">
        {t('auth', 'alreadyRegistered')}{' '}
        <Link href="/login">{t('auth', 'signIn')}</Link>
      </p>

      <p className="v-login-terms">
        {t('auth', 'termsNote')}{' '}
        <a href="/terms">{t('auth', 'termsOfService')}</a>
        {' '}{t('common', 'and')}{' '}
        <a href="/privacy">{t('auth', 'privacyPolicy')}</a>.
      </p>
    </div>
  );
}
