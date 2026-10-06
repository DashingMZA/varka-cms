'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMessages } from '@/lib/i18n';
import { loginPasswordField, otpField, zodErrorKeys } from '@varka/validation';
import { z } from 'zod';
import {
  enableTwoFactorAction,
  verifyTwoFactorEnableAction,
  disableTwoFactorAction,
} from '@/actions/auth';

type Props = {
  enabled: boolean;
};

/** Extract base32 secret from otpauth:// URI for manual entry */
function secretFromTotpUri(uri: string): string | null {
  try {
    const u = new URL(uri);
    return u.searchParams.get('secret');
  } catch {
    const m = /[?&]secret=([^&]+)/i.exec(uri);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }
}

/**
 * Profile / security panel: enable (password + TOTP QR + verify) or disable 2FA.
 */
export function TwoFactorSettings({ enabled: initial }: Props) {
  const { t } = useMessages();
  const [enabled, setEnabled] = useState(initial);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEnable, setPendingEnable] = useState(false);

  function mapKey(key: string): string {
    return t('validation', key) || key;
  }

  // Render scannable QR when totpURI arrives
  useEffect(() => {
    if (!totpUri) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('qrcode');
        const QRCode = mod.default ?? mod;
        const url = await QRCode.toDataURL(totpUri, {
          width: 220,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#1d2327', light: '#ffffff' },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        // Offline / package missing: public QR API fallback
        if (!cancelled) {
          setQrDataUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(totpUri)}`,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [totpUri]);

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
      const result = await enableTwoFactorAction(parsed.data.password);
      if (!result.ok) {
        setError(result.error ?? t('auth', 'invalidCredentials'));
        setLoading(false);
        return;
      }
      const data = result.data ?? {};
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
      const result = await verifyTwoFactorEnableAction(parsed.data.code);
      if (!result.ok) {
        setError(result.error ?? mapKey('otpInvalid'));
        setLoading(false);
        return;
      }
      setEnabled(true);
      setPendingEnable(false);
      setPassword('');
      setCode('');
      setTotpUri(null);
      setQrDataUrl(null);
      setBackupCodes([]);
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
      const result = await disableTwoFactorAction(parsed.data.password);
      if (!result.ok) {
        setError(result.error ?? t('auth', 'invalidCredentials'));
        setLoading(false);
        return;
      }
      setEnabled(false);
      setTotpUri(null);
      setQrDataUrl(null);
      setBackupCodes([]);
      setPassword('');
      setMessage(t('auth', 'twoFactorDisabled'));
    } catch {
      setError(t('auth', 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  const manualSecret = totpUri ? secretFromTotpUri(totpUri) : null;

  return (
    <div className="v-card" style={{ display: 'grid', gap: 12 }}>
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
        <form onSubmit={confirmEnable} style={{ display: 'grid', gap: 12 }}>
          {totpUri ? (
            <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
              <strong style={{ fontSize: 13 }}>{t('auth', 'twoFactorScanQr')}</strong>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={t('auth', 'twoFactorScanQr')}
                  width={220}
                  height={220}
                  style={{
                    display: 'block',
                    border: '1px solid #c3c4c7',
                    borderRadius: 4,
                    background: '#fff',
                  }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: '#646970' }}>…</p>
              )}
              {manualSecret ? (
                <p style={{ margin: 0, fontSize: 12, wordBreak: 'break-all' }}>
                  <span style={{ color: '#646970' }}>Manual key: </span>
                  <code style={{ fontSize: 12 }}>{manualSecret}</code>
                </p>
              ) : null}
            </div>
          ) : null}

          {backupCodes.length ? (
            <div>
              <strong style={{ fontSize: 13 }}>{t('auth', 'twoFactorBackupCodes')}</strong>
              <ul style={{ fontSize: 12, fontFamily: 'monospace', margin: '6px 0 0' }}>
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
              autoComplete="one-time-code"
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
