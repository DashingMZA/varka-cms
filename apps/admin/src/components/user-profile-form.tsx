'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { getMyProfileAction, updateMyProfileAction, getUserProfileAction, updateUserProfileAction } from '@/actions/users';
import { requestOtpAction, verifyOtpAction } from '@/actions/otp';
import { useMessages } from '@/lib/i18n';
import { PasswordInput } from '@/components/password-input';

function L(t: (ns: 'profile' | 'common', key: string) => string, key: string, fallback: string): string {
  const v = t('profile', key);
  if (!v || v === key || v.startsWith('profile.')) return fallback;
  return v;
}

type Profile = {
  id: string;
  name?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  website?: string | null;
  bio?: string | null;
  displayNameAs?: string | null;
  facebookUrl?: string | null;
  xUrl?: string | null;
  instagramUrl?: string | null;
  mediumUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
};

const SOCIAL_FIELDS = [
  { key: 'facebookUrl', label: 'Facebook' },
  { key: 'xUrl', label: 'X (Twitter)' },
  { key: 'instagramUrl', label: 'Instagram' },
  { key: 'mediumUrl', label: 'Medium' },
  { key: 'youtubeUrl', label: 'YouTube' },
  { key: 'tiktokUrl', label: 'TikTok' },
  { key: 'linkedinUrl', label: 'LinkedIn' },
] as const;

export function UserProfileForm({ userId }: { userId?: string }) {
  const { t } = useMessages();
  const isEditingOther = Boolean(userId);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [displayNameAs, setDisplayNameAs] = useState('full_name');
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = userId ? await getUserProfileAction(userId) : await getMyProfileAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const p = res.data as Profile;
      setProfile(p);
      setFirstName(p.firstName ?? '');
      setLastName(p.lastName ?? '');
      setNickname(p.nickname ?? '');
      setWebsite(p.website ?? '');
      setBio(p.bio ?? '');
      setEmail(p.email ?? '');
      setOriginalEmail(p.email ?? '');
      setName(p.name ?? '');
      setDisplayNameAs(p.displayNameAs ?? 'full_name');
      setSocials({
        facebookUrl: p.facebookUrl ?? '',
        xUrl: p.xUrl ?? '',
        instagramUrl: p.instagramUrl ?? '',
        mediumUrl: p.mediumUrl ?? '',
        youtubeUrl: p.youtubeUrl ?? '',
        tiktokUrl: p.tiktokUrl ?? '',
        linkedinUrl: p.linkedinUrl ?? '',
      });
    })();
  }, []);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpAction, setOtpAction] = useState<'email-change' | 'password-change' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [originalEmail, setOriginalEmail] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    // Required field validation (WordPress-style)
    if (!firstName.trim()) { setError('First Name is required'); return; }
    if (!lastName.trim()) { setError('Last Name is required'); return; }
    if (!nickname.trim()) { setError('Nickname is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    if (isEditingOther) {
      // Admin editing another user — no password confirmation needed
      await onAdminSubmit();
      return;
    }
    const emailChanged = email.trim().toLowerCase() !== originalEmail.toLowerCase();
    const passwordChanged = Boolean(newPassword);
    // Sensitive changes require OTP verification
    if (emailChanged) {
      setOtpAction('email-change');
      setOtpSent(false);
      setOtpCode('');
      setShowOtp(true);
      return;
    }
    if (passwordChanged) {
      setOtpAction('password-change');
      setOtpSent(false);
      setOtpCode('');
      setShowOtp(true);
      return;
    }
    // Show password confirmation modal for other changes
    setShowConfirm(true);
  }

  async function onSendOtp() {
    setLoading(true);
    const res = await requestOtpAction(
      otpAction!,
      otpAction === 'email-change' ? email.trim() : undefined
    );
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOtpSent(true);
    setMessage('Verification code sent to your email');
  }

  async function onVerifyOtp() {
    if (!otpCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    setLoading(true);
    const res = await verifyOtpAction(otpAction!, otpCode.trim());
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    // OTP verified — proceed with the update
    setShowOtp(false);
    setOtpCode('');
    setOtpSent(false);
    // If both email and password changed, check if password also needs OTP
    if (otpAction === 'email-change' && newPassword) {
      setOtpAction('password-change');
      setShowOtp(true);
      return;
    }
    // Proceed to password confirmation for final save
    setShowConfirm(true);
  }

  async function onAdminSubmit() {
    setLoading(true);
    const res = await updateUserProfileAction(userId!, {
      firstName,
      lastName,
      nickname,
      website,
      bio,
      email,
      name,
      displayNameAs,
      ...socials,
      ...(newPassword ? { newPassword } : {}),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(L(t, 'profileUpdated', 'Profile updated'));
    setNewPassword('');
  }

  async function onConfirmSubmit() {
    if (!confirmPassword) {
      setError('Please enter your password to confirm');
      return;
    }
    // Required field validation (WordPress-style)
    if (!firstName.trim()) { setError('First Name is required'); return; }
    if (!lastName.trim()) { setError('Last Name is required'); return; }
    if (!nickname.trim()) { setError('Nickname is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    setShowConfirm(false);
    setLoading(true);
    const res = await updateMyProfileAction({
      firstName,
      lastName,
      nickname,
      website,
      bio,
      email,
      name,
      displayNameAs,
      ...socials,
      confirmPassword,
      ...(newPassword
        ? { newPassword, currentPassword }
        : {}),
    });
    setLoading(false);
    setConfirmPassword('');
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(L(t, 'profileUpdated', 'Profile updated'));
    setCurrentPassword('');
    setNewPassword('');
  }

  if (!profile && !error) return <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>;

  return (
      <div className="v-card">
    <form onSubmit={onSubmit} className="v-form v-form--horizontal">
      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      <div className="v-field">
        <label htmlFor="pf-first">{L(t, 'firstName', 'First name')} <span style={{color: '#d63638'}}>*</span></label>
        <input id="pf-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      </div>
      <div className="v-field">
        <label htmlFor="pf-last">{L(t, 'lastName', 'Last name')} <span style={{color: '#d63638'}}>*</span></label>
        <input id="pf-last" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
      </div>
      <div className="v-field">
        <label htmlFor="pf-nick">{L(t, 'nickname', 'Nickname')} <span style={{color: '#d63638'}}>*</span></label>
        <input id="pf-nick" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
      </div>
      <div className="v-field">
        <label htmlFor="pf-display-as">Display name publicly as</label>
        <select id="pf-display-as" value={displayNameAs} onChange={(e) => setDisplayNameAs(e.target.value)}>
          <option value="full_name">{`${firstName} ${lastName}`.trim() || 'Full name'}</option>
          <option value="nickname">{nickname || 'Nickname'}</option>
        </select>
      </div>
      <div className="v-field">
        <label htmlFor="pf-email">{L(t, 'email', 'Email')} <span style={{color: '#d63638'}}>*</span></label>
        <input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="v-field">
        <label htmlFor="pf-web">{L(t, 'website', 'Website')}</label>
        <input id="pf-web" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className="v-field">
        <label htmlFor="pf-bio">{L(t, 'bio', 'Bio')}</label>
        <textarea id="pf-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
      </div>

      <h2 style={{ margin: '16px 0 8px', fontSize: 16 }}>Social Links</h2>
      <p className="v-muted" style={{ fontSize: 13, margin: '0 0 12px' }}>
        These will show on your public author profile.
      </p>
      {SOCIAL_FIELDS.map(({ key, label }) => (
        <div className="v-field" key={key}>
          <label htmlFor={`pf-${key}`}>{label}</label>
          <input
            id={`pf-${key}`}
            value={socials[key] ?? ''}
            onChange={(e) => setSocials((s) => ({ ...s, [key]: e.target.value }))}
            placeholder={`https://...`}
          />
        </div>
      ))}

      <h2 style={{ margin: '12px 0 0', fontSize: 16 }}>{L(t, 'changePassword', 'Change password')}</h2>
      <div className="v-field">
        <label htmlFor="pf-curpass">{L(t, 'currentPassword', 'Current password')}</label>
        <PasswordInput
          id="pf-curpass"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="v-field">
        <label htmlFor="pf-newpass">{L(t, 'newPassword', 'New password')}</label>
        <PasswordInput
          id="pf-newpass"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="v-btn v-btn--primary" disabled={loading}>
        {loading ? L(t, 'saving', 'Saving…') : L(t, 'updateProfile', 'Update Profile')}
      </button>
    </form>

    {showConfirm && typeof document !== 'undefined' ? createPortal(
      <div
        className="v-admin"
        data-admin-scheme={document.querySelector('.v-admin')?.getAttribute('data-admin-scheme') || 'default'}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}
        onClick={() => setShowConfirm(false)}
      >
        <div
          className="v-card"
          style={{ maxWidth: 400, width: '90%', padding: 24, background: '#fff' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Confirm with password</h3>
          <p className="v-muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Enter your current password to apply profile changes.
          </p>
          <div className="v-field">
            <label htmlFor="pf-confirm">Password</label>
            <PasswordInput
              id="pf-confirm"
              autoComplete="current-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void onConfirmSubmit(); }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="button"
              className="v-btn"
              onClick={() => { setShowConfirm(false); setConfirmPassword(''); }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="v-btn v-btn--primary"
              onClick={() => void onConfirmSubmit()}
              disabled={loading}
            >
              Confirm & Save
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
            {otpAction === 'email-change'
              ? `Enter the 6-digit code sent to ${email}`
              : 'Enter the 6-digit code sent to your email'}
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
              <div className="v-field">
                <label htmlFor="pf-otp">Verification code</label>
                <input
                  id="pf-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') void onVerifyOtp(); }}
                  autoFocus
                  style={{ fontSize: 20, letterSpacing: 8, textAlign: 'center' }}
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
