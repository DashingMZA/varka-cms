'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmailAction, resendVerificationAction } from '@/actions/verify-email';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    const res = await verifyEmailAction(email.trim().toLowerCase(), code.trim());
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage('Email verified! Redirecting to login…');
    setTimeout(() => router.push('/login'), 1500);
  }

  async function onResend() {
    if (!email.trim()) {
      setError('Enter your email first');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await resendVerificationAction(email.trim().toLowerCase());
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage('New code sent to your email');
  }

  return (
    <main className="v-auth-page">
      <div className="v-auth-card">
        <h1 className="v-auth-title">Verify your email</h1>
        <p className="v-muted" style={{ fontSize: 14, marginBottom: 20 }}>
          Enter the 6-digit code sent to your email address.
        </p>
        <form onSubmit={onSubmit} className="v-form">
          {error ? (
            <p role="alert" className="v-alert v-alert--error">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="v-alert v-alert--success">
              {message}
            </p>
          ) : null}
          <div className="v-field">
            <label htmlFor="ve-email">Email</label>
            <input
              id="ve-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="v-field">
            <label htmlFor="ve-code">Verification code</label>
            <input
              id="ve-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ fontSize: 20, letterSpacing: 8, textAlign: 'center' }}
              required
            />
          </div>
          <button
            type="submit"
            className="v-btn v-btn--primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Verifying…' : 'Verify email'}
          </button>
          <button
            type="button"
            className="v-btn"
            onClick={() => void onResend()}
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            Resend code
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center' }}>
          <a href="/login" className="v-link">Back to login</a>
        </p>
      </div>
    </main>
  );
}
