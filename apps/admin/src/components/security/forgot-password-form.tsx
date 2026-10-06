'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMessages, setStoredLocale } from '@/lib/i18n';
import { useServerLocale } from '@/lib/locale-provider';
import type { AppLocale } from '@varka/i18n';
import { AuthHeader } from '@/components/auth-header';
import { forgotPasswordSchema, zodErrorKeys } from '@varka/validation';
import { PasswordInput } from '@/components/password-input';
import {
  requestPasswordResetOtpAction,
  verifyPasswordResetOtpAction,
  resetPasswordWithTokenAction,
} from '@/actions/password-reset';

type Step = 'email' | 'otp' | 'new-password' | 'done';

export function ForgotPasswordForm() {
  const router = useRouter();
  const serverLocale = useServerLocale();
  const [locale, setLocale] = useState<AppLocale>(serverLocale);
  const { t } = useMessages(locale);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function mapKey(key: string): string {
    return t('validation', key) || key;
  }

  async function onEmailSubmit(e: FormEvent) {
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
      await requestPasswordResetOtpAction(parsed.data.email);
      setStep('otp');
    } catch {
      setError(t('auth', 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (otpCode.trim().length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyPasswordResetOtpAction(email.trim().toLowerCase(), otpCode.trim());
      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setResetToken(res.data!.resetToken);
      setStep('new-password');
    } catch {
      setError(t('auth', 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPasswordWithTokenAction(
        email.trim().toLowerCase(),
        resetToken,
        newPassword,
      );
      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setStep('done');
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError(t('auth', 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  function onLocale(next: AppLocale) {
    setStoredLocale(next);
    setLocale(next);
  }

  return (
    <div className="v-login-screen-modern">
      <div className="v-login-modern">
        <AuthHeader locale={locale} onLocale={onLocale} />
        <h2 className="v-login-title">{t('auth', 'forgotTitle')}</h2>
        <p className="v-login-subtitle">
          {step === 'email' && t('auth', 'forgotHint')}
          {step === 'otp' && 'Enter the 6-digit code sent to your email.'}
          {step === 'new-password' && 'Enter your new password.'}
          {step === 'done' && 'Password reset successful! Redirecting to login…'}
        </p>

        {step === 'email' && (
          <form className="v-login-form-modern" onSubmit={onEmailSubmit}>
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
            {error ? <p className="v-login-error-modern">{error}</p> : null}
            <button type="submit" className="v-login-submit-modern" disabled={loading}>
              {loading ? t('auth', 'signingIn') : 'Send code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="v-login-form-modern" onSubmit={onOtpSubmit}>
            <label className="v-login-field">
              <span className="v-login-field-label">Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{ fontSize: 20, letterSpacing: 8, textAlign: 'center' }}
                autoFocus
              />
            </label>
            {error ? <p className="v-login-error-modern">{error}</p> : null}
            <button type="submit" className="v-login-submit-modern" disabled={loading}>
              {loading ? t('auth', 'signingIn') : 'Verify code'}
            </button>
            <button
              type="button"
              className="v-btn"
              onClick={() => void requestPasswordResetOtpAction(email.trim().toLowerCase())}
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              Resend code
            </button>
          </form>
        )}

        {step === 'new-password' && (
          <form className="v-login-form-modern" onSubmit={onPasswordSubmit}>
            <div className="v-field">
              <label htmlFor="fp-new">New password</label>
              <PasswordInput
                id="fp-new"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="v-field">
              <label htmlFor="fp-confirm">Confirm password</label>
              <PasswordInput
                id="fp-confirm"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="v-login-error-modern">{error}</p> : null}
            <button type="submit" className="v-login-submit-modern" disabled={loading}>
              {loading ? t('auth', 'signingIn') : 'Reset password'}
            </button>
          </form>
        )}

        <p className="v-login-return">
          <Link href="/login">{t('auth', 'signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
