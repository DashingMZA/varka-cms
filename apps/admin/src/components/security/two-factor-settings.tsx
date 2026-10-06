'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMessages } from '@/lib/i18n';
import { PasswordInput } from '@/components/password-input';
import { requestOtpAction, verifyOtpAction } from '@/actions/otp';
import { createPortal } from 'react-dom';
import { otpField, zodErrorKeys } from '@varka/validation';
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
  const [code, setCode] = useState('');
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEnable, setPendingEnable] = useState(false);
  // OTP verification for sensitive 2FA actions
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpAction, setOtpAction] = useState<'2fa-enable' | '2fa-disable' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingPassword, setPendingPassword] = useState('');
  // Password confirmation popup (like Update Profile)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'enable' | 'disable' | null>(null);

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
    // Show password confirmation popup first (like Update Profile)
    setPendingAction('enable');
    setConfirmPassword('');
    setShowPasswordConfirm(true);
  }

  async function onPasswordConfirm() {
    if (!confirmPassword) {
      setError('Please enter your password');
      return;
    }
    setShowPasswordConfirm(false);
    setPendingPassword(confirmPassword);
    setConfirmPassword('');
    // Require OTP verification before 2FA action
    setOtpAction(pendingAction === 'enable' ? '2fa-enable' : '2fa-disable');
    setOtpSent(false);
    setOtpCode('');
    setShowOtp(true);
  }

  async function doEnableWithOtp() {
    setLoading(true);
    try {
      const result = await enableTwoFactorAction(pendingPassword);
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
      setShowOtp(false);
      setPendingPassword('');
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
    // Show password confirmation popup first (like Update Profile)
    setPendingAction('disable');
    setConfirmPassword('');
    setShowPasswordConfirm(true);
  }

  async function doDisableWithOtp() {
    setLoading(true);
    try {
      const result = await disableTwoFactorAction(pendingPassword);
      if (!result.ok) {
        setError(result.error ?? t('auth', 'invalidCredentials'));
        setLoading(false);
        return;
      }
      setEnabled(false);
      setTotpUri(null);
      setQrDataUrl(null);
      setBackupCodes([]);
      setMessage(t('auth', 'twoFactorDisabled'));
      setShowOtp(false);
      setPendingPassword('');
    } catch {
      setError(t('auth', 'networkError'));
    } finally {
      setLoading(false);
    }
  }

  async function onSendOtp() {
    setLoading(true);
    const res = await requestOtpAction(otpAction!);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOtpSent(true);
  }

  async function onVerifyOtp() {
    if (otpCode.trim().length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    const res = await verifyOtpAction(otpAction!, otpCode.trim());
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    // OTP verified — proceed with the 2FA action
    setOtpCode('');
    setOtpSent(false);
    if (otpAction === '2fa-enable') {
      await doEnableWithOtp();
    } else {
      await doDisableWithOtp();
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
          <button type="submit" className="v-btn" disabled={loading}>
            {t('auth', 'twoFactorDisable')}
          </button>
        </form>
      ) : null}

      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--success">{message}</p> : null}

      {showPasswordConfirm && typeof document !== 'undefined' ? createPortal(
        <div
          className="v-admin"
          data-admin-scheme={document.querySelector('.v-admin')?.getAttribute('data-admin-scheme') || 'default'}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
          onClick={() => setShowPasswordConfirm(false)}
        >
          <div
            className="v-card"
            style={{ maxWidth: 400, width: '90%', padding: 24, background: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Confirm with password</h3>
            <p className="v-muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Enter your current password to {pendingAction === 'enable' ? 'enable' : 'disable'} two-factor authentication.
            </p>
            <div className="v-field">
              <label htmlFor="2fa-confirm">Password</label>
              <PasswordInput
                id="2fa-confirm"
                autoComplete="current-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void onPasswordConfirm(); }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                className="v-btn"
                onClick={() => { setShowPasswordConfirm(false); setConfirmPassword(''); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="v-btn v-btn--primary"
                onClick={() => void onPasswordConfirm()}
                disabled={loading || !confirmPassword}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {showOtp && typeof document !== 'undefined' ? createPortal(
        <div
          className="v-admin"
          data-admin-scheme={document.querySelector('.v-admin')?.getAttribute('data-admin-scheme') || 'default'}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
          onClick={() => setShowOtp(false)}
        >
          <div
            className="v-card"
            style={{ maxWidth: 400, width: '90%', padding: 24, background: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Verify with code</h3>
            <p className="v-muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Enter the 6-digit code sent to your email to {otpAction === '2fa-enable' ? 'enable' : 'disable'} two-factor authentication.
            </p>
            {!otpSent ? (
              <button
                type="button"
                className="v-btn v-btn--primary"
                onClick={() => void onSendOtp()}
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Sending…' : 'Send verification code'}
              </button>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="2fa-otp"
                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}
                  >
                    Verification code
                  </label>
                  <input
                    id="2fa-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') void onVerifyOtp(); }}
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: 44,
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      fontSize: 22,
                      letterSpacing: 10,
                      textAlign: 'center',
                      color: '#111827',
                      background: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button
                    type="button"
                    className="v-btn"
                    onClick={() => { setShowOtp(false); setOtpCode(''); setOtpSent(false); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="v-btn"
                    onClick={() => void onSendOtp()}
                    disabled={loading}
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    className="v-btn v-btn--primary"
                    onClick={() => void onVerifyOtp()}
                    disabled={loading || otpCode.length !== 6}
                  >
                    Verify
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
