'use client';

import { Field, SettingsForm, inputStyle, selectStyle } from '@/components/settings/settings-form';
import { useMessages } from '@/lib/i18n';
import { ROLES } from '@varka/permissions';

function L(t: (ns: 'settings' | 'common', key: string) => string, key: string, fallback: string): string {
  const v = t('settings', key);
  if (!v || v === key || v.startsWith('settings.')) return fallback;
  return v;
}

const DEFAULTS = {
  // Registration
  anyoneCanRegister: false,
  defaultRole: 'reader',
  requireEmailVerification: true,
  requireAdminApproval: true,
  // Profile field requirements
  requireFirstName: true,
  requireLastName: true,
  requireNickname: true,
  requireWebsite: false,
  requireBio: false,
  // Password policy
  passwordMinLength: 12,
  requireOtpOnEmailChange: true,
  requireOtpOnPasswordChange: true,
  requireOtpOn2fa: true,
  // Email provider
  emailProvider: 'smtp',
  // SMTP (database-driven, overrides .env when enabled)
  smtpEnabled: false,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  smtpFromName: 'VARKA',
  smtpSecure: true,
  // Resend
  resendApiKey: '',
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export default function UserSettingsPage() {
  const { t } = useMessages();
  return (
    <SettingsForm
      group="users"
      title={L(t, 'userSettingsTitle', 'User Settings')}
      description={L(t, 'userSettingsDesc', 'Control registration, profile requirements, password policy, and email (SMTP) settings.')}
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 8px' }}>{L(t, 'registration', 'Registration')}</h2>
            </td>
          </tr>
          <Field
            label={L(t, 'membership', 'Membership')}
            hint={L(t, 'membershipHint', 'Allow new users to register on this site.')}
          >
            <Toggle
              checked={Boolean(v.anyoneCanRegister)}
              onChange={(val) => set('anyoneCanRegister', val)}
              label={L(t, 'anyoneCanRegister', 'Anyone can register')}
            />
          </Field>
          <Field
            label={L(t, 'newUserDefaultRole', 'New User Default Role')}
            hint={L(t, 'defaultRoleHint', 'The default role assigned to newly registered users.')}
          >
            <select
              style={selectStyle}
              value={String(v.defaultRole ?? 'reader')}
              onChange={(e) => set('defaultRole', e.target.value)}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={L(t, 'emailVerification', 'Email Verification')}
            hint={L(t, 'emailVerificationHint', 'New users must verify their email before they can log in.')}
          >
            <Toggle
              checked={Boolean(v.requireEmailVerification)}
              onChange={(val) => set('requireEmailVerification', val)}
              label={L(t, 'requireEmailVerification', 'Require email verification')}
            />
          </Field>
          <Field
            label={L(t, 'adminApproval', 'Admin Approval')}
            hint={L(t, 'adminApprovalHint', 'New registrations require manual admin approval before login.')}
          >
            <Toggle
              checked={Boolean(v.requireAdminApproval)}
              onChange={(val) => set('requireAdminApproval', val)}
              label={L(t, 'requireAdminApproval', 'Require admin approval')}
            />
          </Field>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>{L(t, 'profileRequirements', 'Profile Requirements')}</h2>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)' }}>
                {L(t, 'profileRequirementsDesc', 'Choose which profile fields are required.')}
              </p>
            </td>
          </tr>
          <Field label={L(t, 'firstName', 'First Name')} hint={L(t, 'firstNameHint', 'Require first name on profile and registration.')}>
            <Toggle
              checked={Boolean(v.requireFirstName)}
              onChange={(val) => set('requireFirstName', val)}
              label={L(t, 'required', 'Required')}
            />
          </Field>
          <Field label={L(t, 'lastName', 'Last Name')} hint={L(t, 'lastNameHint', 'Require last name on profile and registration.')}>
            <Toggle
              checked={Boolean(v.requireLastName)}
              onChange={(val) => set('requireLastName', val)}
              label={L(t, 'required', 'Required')}
            />
          </Field>
          <Field label={L(t, 'nickname', 'Nickname')} hint={L(t, 'nicknameHint', 'Require nickname on profile and registration.')}>
            <Toggle
              checked={Boolean(v.requireNickname)}
              onChange={(val) => set('requireNickname', val)}
              label={L(t, 'required', 'Required')}
            />
          </Field>
          <Field label={L(t, 'website', 'Website')} hint={L(t, 'websiteHint', 'Require website URL on profile.')}>
            <Toggle
              checked={Boolean(v.requireWebsite)}
              onChange={(val) => set('requireWebsite', val)}
              label={L(t, 'required', 'Required')}
            />
          </Field>
          <Field label={L(t, 'bio', 'Biographical Info')} hint={L(t, 'bioHint', 'Require bio on profile.')}>
            <Toggle
              checked={Boolean(v.requireBio)}
              onChange={(val) => set('requireBio', val)}
              label={L(t, 'required', 'Required')}
            />
          </Field>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>{L(t, 'passwordSecurity', 'Password & Security')}</h2>
            </td>
          </tr>
          <Field
            label={L(t, 'minLength', 'Minimum Length')}
            hint={L(t, 'minLengthHint', 'Minimum password length (default 12).')}
          >
            <input
              type="number"
              min={8}
              max={128}
              style={{ ...inputStyle, maxWidth: 120 }}
              value={Number(v.passwordMinLength ?? 12)}
              onChange={(e) => set('passwordMinLength', parseInt(e.target.value, 10) || 12)}
            />
          </Field>
          <Field
            label={L(t, 'emailChange', 'Email Change')}
            hint={L(t, 'emailChangeHint', 'Require OTP verification when user changes their email.')}
          >
            <Toggle
              checked={Boolean(v.requireOtpOnEmailChange)}
              onChange={(val) => set('requireOtpOnEmailChange', val)}
              label={L(t, 'requireOtp', 'Require OTP verification')}
            />
          </Field>
          <Field
            label={L(t, 'passwordChange', 'Password Change')}
            hint={L(t, 'passwordChangeHint', 'Require OTP verification when user changes their password.')}
          >
            <Toggle
              checked={Boolean(v.requireOtpOnPasswordChange)}
              onChange={(val) => set('requireOtpOnPasswordChange', val)}
              label={L(t, 'requireOtp', 'Require OTP verification')}
            />
          </Field>
          <Field
            label={L(t, 'twoFactorAuth', 'Two-Factor Auth')}
            hint={L(t, 'twoFactorHint', 'Require OTP verification for 2FA enable/disable.')}
          >
            <Toggle
              checked={Boolean(v.requireOtpOn2fa)}
              onChange={(val) => set('requireOtpOn2fa', val)}
              label={L(t, 'requireOtp', 'Require OTP verification')}
            />
          </Field>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>{L(t, 'emailProvider', 'Email Provider')}</h2>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)' }}>
                {L(t, 'emailProviderDesc', 'Choose which email service to use. Priority: Database → .env (Resend → SMTP → Webhook).')}
              </p>
            </td>
          </tr>
          <Field
            label={L(t, 'provider', 'Provider')}
            hint={L(t, 'providerHint', 'SMTP for your own mail server, Resend for API-based sending.')}
          >
            <select
              style={selectStyle}
              value={String(v.emailProvider ?? 'smtp')}
              onChange={(e) => set('emailProvider', e.target.value)}
            >
              <option value="smtp">SMTP</option>
              <option value="resend">{L(t, 'resend', 'Resend')}</option>
            </select>
          </Field>

          {String(v.emailProvider ?? 'smtp') === 'resend' ? (
            <Field
              label={L(t, 'resendApiKey', 'Resend API Key')}
              hint={L(t, 'resendApiKeyHint', 'Get your API key from resend.com. Stored in database.')}
            >
              <input
                type="password"
                style={inputStyle}
                value={String(v.resendApiKey ?? '')}
                onChange={(e) => set('resendApiKey', e.target.value)}
                placeholder="re_..."
                autoComplete="off"
              />
            </Field>
          ) : null}

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>{L(t, 'smtpSection', 'Email (SMTP)')}</h2>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)' }}>
                {L(t, 'smtpSectionDesc', 'Configure SMTP in the database. When enabled, these settings override .env values.')}
              </p>
            </td>
          </tr>
          <Field
            label={L(t, 'customSmtp', 'Custom SMTP')}
            hint={L(t, 'customSmtpHint', 'Use database SMTP settings instead of .env / webhook.')}
          >
            <Toggle
              checked={Boolean(v.smtpEnabled)}
              onChange={(val) => set('smtpEnabled', val)}
              label={L(t, 'enableCustomSmtp', 'Enable custom SMTP')}
            />
          </Field>
          {Boolean(v.smtpEnabled) ? (
            <>
              <Field label={L(t, 'smtpHost', 'SMTP Host')} hint={L(t, 'smtpHostHint', 'e.g. smtp.gmail.com')}>
                <input
                  style={inputStyle}
                  value={String(v.smtpHost ?? '')}
                  onChange={(e) => set('smtpHost', e.target.value)}
                  placeholder="smtp.example.com"
                />
              </Field>
              <Field label={L(t, 'smtpPort', 'SMTP Port')} hint={L(t, 'smtpPortHint', 'Usually 587 (TLS) or 465 (SSL).')}>
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 120 }}
                  value={Number(v.smtpPort ?? 587)}
                  onChange={(e) => set('smtpPort', parseInt(e.target.value, 10) || 587)}
                />
              </Field>
              <Field label={L(t, 'smtpUsername', 'SMTP Username')} hint={L(t, 'smtpUsernameHint', 'Your SMTP login username.')}>
                <input
                  style={inputStyle}
                  value={String(v.smtpUser ?? '')}
                  onChange={(e) => set('smtpUser', e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label={L(t, 'smtpPassword', 'SMTP Password')} hint={L(t, 'smtpPasswordHint', 'Your SMTP login password.')}>
                <input
                  type="password"
                  style={inputStyle}
                  value={String(v.smtpPass ?? '')}
                  onChange={(e) => set('smtpPass', e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <Field label={L(t, 'fromEmail', 'From Email')} hint={L(t, 'fromEmailHint', 'Sender email address.')}>
                <input
                  type="email"
                  style={inputStyle}
                  value={String(v.smtpFrom ?? '')}
                  onChange={(e) => set('smtpFrom', e.target.value)}
                  placeholder="noreply@example.com"
                />
              </Field>
              <Field label={L(t, 'fromName', 'From Name')} hint={L(t, 'fromNameHint', 'Sender display name.')}>
                <input
                  style={inputStyle}
                  value={String(v.smtpFromName ?? 'VARKA')}
                  onChange={(e) => set('smtpFromName', e.target.value)}
                />
              </Field>
              <Field label={L(t, 'useTlsSsl', 'Use TLS/SSL')} hint={L(t, 'useTlsSslHint', 'Port 465 = SSL. Port 587 = STARTTLS.')}>
                <Toggle
                  checked={Boolean(v.smtpSecure)}
                  onChange={(val) => set('smtpSecure', val)}
                  label={L(t, 'secureConnection', 'Secure connection (SSL)')}
                />
              </Field>
            </>
          ) : null}
        </>
      )}
    </SettingsForm>
  );
}
