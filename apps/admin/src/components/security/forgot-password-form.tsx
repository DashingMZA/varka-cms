'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMessages } from '@/lib/i18n';
import { useServerLocale } from '@/lib/locale-provider';
import { forgotPasswordSchema, zodErrorKeys } from '@varka/validation';
import { forgetPasswordAction } from '@/actions/auth';

export function ForgotPasswordForm() {
  const serverLocale = useServerLocale();
  const { t } = useMessages(serverLocale);
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
      const result = await forgetPasswordAction(
        parsed.data.email,
        `${window.location.origin}/reset-password`,
      );
      if (!result.ok) {
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
    <div className="v-login-screen-modern">
      <div className="v-login-modern">
        <h1 className="v-login-brand">VARKA</h1>
        <h2 className="v-login-title">{t('auth', 'forgotTitle')}</h2>
        <p className="v-login-subtitle">{t('auth', 'forgotHint')}</p>

        <form className="v-login-form-modern" onSubmit={onSubmit}>
          {done ? (
            <p className="v-login-success-modern">{t('auth', 'codeSent')}</p>
          ) : (
            <label className="v-login-field">
              <span className="v-login-field-label">{t('auth', 'email')}</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth', 'emailPlaceholder')}
              />
              {fieldErrors.email ? (
                <span className="v-field-error">{fieldErrors.email}</span>
              ) : null}
            </label>
          )}
          {error ? <p className="v-login-error-modern">{error}</p> : null}
          {!done ? (
            <button type="submit" className="v-login-submit-modern" disabled={loading}>
              {loading ? t('auth', 'signingIn') : t('auth', 'forgotSubmit')}
            </button>
          ) : null}
        </form>

        <p className="v-login-return">
          <Link href="/login">{t('auth', 'signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
