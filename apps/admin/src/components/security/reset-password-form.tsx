'use client';

import { use, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMessages, setStoredLocale } from '@/lib/i18n';
import { useServerLocale } from '@/lib/locale-provider';
import type { AppLocale } from '@varka/i18n';
import { AuthHeader } from '@/components/auth-header';
import { resetPasswordSchema, zodErrorKeys } from '@varka/validation';
import { resetPasswordAction } from '@/actions/auth';

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

export function ResetPasswordForm({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = use(searchParams);
  const token = params.token ?? '';
  const serverLocale = useServerLocale();
  const [locale, setLocale] = useState<AppLocale>(serverLocale);
  const { t } = useMessages(locale);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function mapKey(key: string): string {
    return t('validation', key) || key;
  }

  function onLocale(next: AppLocale) {
    setStoredLocale(next);
    setLocale(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const parsed = resetPasswordSchema.safeParse({ token, password, passwordConfirm });
    if (!parsed.success) {
      const keys = zodErrorKeys(parsed.error);
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(keys)) mapped[k] = mapKey(v);
      setFieldErrors(mapped);
      return;
    }
    setLoading(true);
    try {
      const result = await resetPasswordAction(parsed.data.token, parsed.data.password);
      if (!result.ok) {
        setError(result.error ?? mapKey('tokenRequired'));
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

  if (!token) {
    return (
      <div className="v-login-screen-modern">
        <div className="v-login-modern">
          <AuthHeader locale={locale} onLocale={onLocale} />
          <p className="v-login-error-modern">{mapKey('tokenRequired')}</p>
          <p className="v-login-return">
            <Link href="/forgot-password">{t('auth', 'forgotPassword')}</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="v-login-screen-modern">
      <div className="v-login-modern">
        <AuthHeader locale={locale} onLocale={onLocale} />
        <h2 className="v-login-title">{t('auth', 'resetTitle')}</h2>

        {done ? (
          <>
            <p className="v-login-success-modern">{t('auth', 'resetSuccess')}</p>
            <p className="v-login-return">
              <Link href="/login">{t('auth', 'signIn')}</Link>
            </p>
          </>
        ) : (
          <form className="v-login-form-modern" onSubmit={onSubmit}>
            <div className="v-login-field">
              <span className="v-login-field-label">{t('auth', 'newPassword')}</span>
              <div className="v-login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth', 'passwordPlaceholder')}
                  aria-label={t('auth', 'newPassword')}
                />
                <button
                  type="button"
                  className="v-login-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth', 'hidePassword') : t('auth', 'showPassword')}
                  tabIndex={-1}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
              {fieldErrors.password ? (
                <span className="v-field-error">{fieldErrors.password}</span>
              ) : null}
            </div>
            <div className="v-login-field">
              <span className="v-login-field-label">{t('auth', 'passwordConfirm')}</span>
              <div className="v-login-password-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder={t('auth', 'passwordPlaceholder')}
                  aria-label={t('auth', 'passwordConfirm')}
                />
                <button
                  type="button"
                  className="v-login-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? t('auth', 'hidePassword') : t('auth', 'showPassword')}
                  tabIndex={-1}
                >
                  <EyeIcon off={showConfirm} />
                </button>
              </div>
              {fieldErrors.passwordConfirm ? (
                <span className="v-field-error">{fieldErrors.passwordConfirm}</span>
              ) : null}
            </div>
            {error ? <p className="v-login-error-modern">{error}</p> : null}
            <button type="submit" className="v-login-submit-modern" disabled={loading}>
              {loading ? t('auth', 'signingIn') : t('auth', 'resetSubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
