'use client';

import { useState, type FormEvent } from 'react';
import { useMessages } from '@/lib/i18n';
import { loginPasswordField, otpField, zodErrorKeys } from '@varka/validation';
import { z } from 'zod';

type Props = {
  enabled: boolean;
};

/**
 * Profile / security panel: enable (password + TOTP verify) or disable 2FA.
 */
export function TwoFactorSettings({ enabled: initial }: Props) {
  const { t } = useMessages();
  const [enabled, setEnabled] = useState(initial);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEnable, setPendingEnable] = useState(false);

  function mapKey(key: string): string {
    return t('validation', key) || key;
  }

  async function startEnable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const parsed = z.object({ password: loginPasswordField }).safeParse({ password });
    if (!parsed.success) {
      setError(mapKey(zodErrorKeys(parsed.error).password || 'passwordRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/two-factor/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ password: parsed.data.password }),
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        totpURI?: string;
        backupCodes?: string[];
      };
      if (!res.ok) {
        setError(data.message ?? t('auth', 'invalidCredentials'));
        setLoading(false);
        return;
      }
      setTotpUri(data.totpURI ?? null);
      setBackupCodes(Array.isArray(data.backupCodes) ? data.backupCodes : []);
      setPendingEnable(true);
      setMessage(t('auth', 'twoFactorScanQr'));
    } catch {
      setError(t('auth', 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = z.object({ code: otpField }).safeParse({ code });
    if (!parsed.success) {
      setError(mapKey(zodErrorKeys(parsed.error).code || 'otpLength'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/two-factor/verify-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ code: parsed.data.code }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? mapKey('otpInvalid'));
        setLoading(false);
        return;
      }
      setEnabled(true);
      setPendingEnable(false);
      setPassword('');
      setCode('');
      setMessage(t('auth', 'twoFactorEnabled'));
    } catch {
      setError(t('auth', 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const parsed = z.object({ password: loginPasswordField }).safeParse({ password });
    if (!parsed.success) {
      setError(mapKey(zodErrorKeys(parsed.error).password || 'passwordRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/two-factor/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ password: parsed.data.password }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? t('auth', 'invalidCredentials'));
        setLoading(false);
        return;
      }
      setEnabled(false);
      setTotpUri(null);
      setBackupCodes([]);
      setPassword('');
      setMessage(t('auth', 'twoFactorDisabled'));
    } catch {
      setError(t('auth', 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="v-card" style={{ padding: 16, display: 'grid', gap: 12, maxWidth: 480 }}>
      <h2 style={{ margin: 0, fontSize: 16 }}>{t('auth', 'twoFactorTitle')}</h2>
      <p style={{ margin: 0, fontSize: 13, color: '#646970' }}>
        {enabled ? t('auth', 'twoFactorEnabled') : t('auth', 'twoFactorDisabled')}
      </p>

      {!enabled && !pendingEnable ? (
        <form onSubmit={startEnable} style={{ display: 'grid', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            {t('auth', 'password')}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
            {t('auth', 'twoFactorEnable')}
          </button>
        </form>
      ) : null}

      {pendingEnable ? (
        <form onSubmit={confirmEnable} style={{ display: 'grid', gap: 8 }}>
          {totpUri ? (
            <p style={{ fontSize: 12, wordBreak: 'break-all' }}>
              <strong>{t('auth', 'twoFactorScanQr')}</strong>
              <br />
              {totpUri}
            </p>
          ) : null}
          {backupCodes.length ? (
            <div>
              <strong style={{ fontSize: 13 }}>{t('auth', 'twoFactorBackupCodes')}</strong>
              <ul style={{ fontSize: 12, fontFamily: 'monospace' }}>
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            {t('auth', 'verifyCode')}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />
          </label>
          <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
            {t('auth', 'twoFactorSubmit')}
          </button>
        </form>
      ) : null}

      {enabled ? (
        <form onSubmit={disable} style={{ display: 'grid', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            {t('auth', 'password')}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="v-btn" disabled={loading}>
            {t('auth', 'twoFactorDisable')}
          </button>
        </form>
      ) : null}

      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--success">{message}</p> : null}
    </div>
  );
}
