'use client';

import { use, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMessages } from '@/lib/i18n';
import { resetPasswordSchema, zodErrorKeys } from '@varka/validation';
import { resetPasswordAction } from '@/actions/auth';

export function ResetPasswordForm({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = use(searchParams);
  const token = params.token ?? '';
  const { t } = useMessages();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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
      <div style={{ maxWidth: 360, margin: '48px auto' }}>
        <p className="v-alert v-alert--error">{mapKey('tokenRequired')}</p>
        <Link href="/forgot-password">{t('auth', 'forgotPassword')}</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ maxWidth: 360, margin: '48px auto', display: 'grid', gap: 12 }}
    >
      <h1 style={{ margin: 0, fontSize: 22 }}>{t('auth', 'resetTitle')}</h1>
      {done ? (
        <>
          <p className="v-alert v-alert--success">{t('auth', 'resetSuccess')}</p>
          <Link href="/login">{t('auth', 'signIn')}</Link>
        </>
      ) : (
        <>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            {t('auth', 'newPassword')}
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldErrors.password ? (
              <span className="v-field-error">{fieldErrors.password}</span>
            ) : null}
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            {t('auth', 'passwordConfirm')}
            <input
              type="password"
              autoComplete="new-password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            {fieldErrors.passwordConfirm ? (
              <span className="v-field-error">{fieldErrors.passwordConfirm}</span>
            ) : null}
          </label>
          {error ? <p className="v-alert v-alert--error">{error}</p> : null}
          <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
            {loading ? t('auth', 'signingIn') : t('auth', 'resetSubmit')}
          </button>
        </>
      )}
    </form>
  );
}
