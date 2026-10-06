'use client';

import { Field, SettingsForm, inputStyle, selectStyle } from '@/components/settings/settings-form';
import { useMessages } from '@/lib/i18n';
import { ROLES } from '@varka/permissions';

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
  // SMTP (database-driven, overrides .env when enabled)
  smtpEnabled: false,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  smtpFromName: 'VARKA',
  smtpSecure: true,
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
      title="User Settings"
      description="Control registration, profile requirements, password policy, and email (SMTP) settings."
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 8px' }}>Registration</h2>
            </td>
          </tr>
          <Field
            label="Membership"
            hint="Allow new users to register on this site."
          >
            <Toggle
              checked={Boolean(v.anyoneCanRegister)}
              onChange={(val) => set('anyoneCanRegister', val)}
              label="Anyone can register"
            />
          </Field>
          <Field
            label="New User Default Role"
            hint="The default role assigned to newly registered users."
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
            label="Email Verification"
            hint="New users must verify their email before they can log in."
          >
            <Toggle
              checked={Boolean(v.requireEmailVerification)}
              onChange={(val) => set('requireEmailVerification', val)}
              label="Require email verification"
            />
          </Field>
          <Field
            label="Admin Approval"
            hint="New registrations require manual admin approval before login."
          >
            <Toggle
              checked={Boolean(v.requireAdminApproval)}
              onChange={(val) => set('requireAdminApproval', val)}
              label="Require admin approval"
            />
          </Field>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>Profile Requirements</h2>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)' }}>
                Choose which profile fields are required.
              </p>
            </td>
          </tr>
          <Field label="First Name" hint="Require first name on profile and registration.">
            <Toggle
              checked={Boolean(v.requireFirstName)}
              onChange={(val) => set('requireFirstName', val)}
              label="Required"
            />
          </Field>
          <Field label="Last Name" hint="Require last name on profile and registration.">
            <Toggle
              checked={Boolean(v.requireLastName)}
              onChange={(val) => set('requireLastName', val)}
              label="Required"
            />
          </Field>
          <Field label="Nickname" hint="Require nickname on profile and registration.">
            <Toggle
              checked={Boolean(v.requireNickname)}
              onChange={(val) => set('requireNickname', val)}
              label="Required"
            />
          </Field>
          <Field label="Website" hint="Require website URL on profile.">
            <Toggle
              checked={Boolean(v.requireWebsite)}
              onChange={(val) => set('requireWebsite', val)}
              label="Required"
            />
          </Field>
          <Field label="Biographical Info" hint="Require bio on profile.">
            <Toggle
              checked={Boolean(v.requireBio)}
              onChange={(val) => set('requireBio', val)}
              label="Required"
            />
          </Field>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>Password & Security</h2>
            </td>
          </tr>
          <Field
            label="Minimum Length"
            hint="Minimum password length (default 12)."
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
            label="Email Change"
            hint="Require OTP verification when user changes their email."
          >
            <Toggle
              checked={Boolean(v.requireOtpOnEmailChange)}
              onChange={(val) => set('requireOtpOnEmailChange', val)}
              label="Require OTP verification"
            />
          </Field>
          <Field
            label="Password Change"
            hint="Require OTP verification when user changes their password."
          >
            <Toggle
              checked={Boolean(v.requireOtpOnPasswordChange)}
              onChange={(val) => set('requireOtpOnPasswordChange', val)}
              label="Require OTP verification"
            />
          </Field>
          <Field
            label="Two-Factor Auth"
            hint="Require OTP verification for 2FA enable/disable."
          >
            <Toggle
              checked={Boolean(v.requireOtpOn2fa)}
              onChange={(val) => set('requireOtpOn2fa', val)}
              label="Require OTP verification"
            />
          </Field>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>Email (SMTP)</h2>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)' }}>
                Configure SMTP in the database. When enabled, these settings override .env values.
              </p>
            </td>
          </tr>
          <Field
            label="Custom SMTP"
            hint="Use database SMTP settings instead of .env / webhook."
          >
            <Toggle
              checked={Boolean(v.smtpEnabled)}
              onChange={(val) => set('smtpEnabled', val)}
              label="Enable custom SMTP"
            />
          </Field>
          {Boolean(v.smtpEnabled) ? (
            <>
              <Field label="SMTP Host" hint="e.g. smtp.gmail.com">
                <input
                  style={inputStyle}
                  value={String(v.smtpHost ?? '')}
                  onChange={(e) => set('smtpHost', e.target.value)}
                  placeholder="smtp.example.com"
                />
              </Field>
              <Field label="SMTP Port" hint="Usually 587 (TLS) or 465 (SSL).">
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 120 }}
                  value={Number(v.smtpPort ?? 587)}
                  onChange={(e) => set('smtpPort', parseInt(e.target.value, 10) || 587)}
                />
              </Field>
              <Field label="SMTP Username" hint="Your SMTP login username.">
                <input
                  style={inputStyle}
                  value={String(v.smtpUser ?? '')}
                  onChange={(e) => set('smtpUser', e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label="SMTP Password" hint="Your SMTP login password.">
                <input
                  type="password"
                  style={inputStyle}
                  value={String(v.smtpPass ?? '')}
                  onChange={(e) => set('smtpPass', e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="From Email" hint="Sender email address.">
                <input
                  type="email"
                  style={inputStyle}
                  value={String(v.smtpFrom ?? '')}
                  onChange={(e) => set('smtpFrom', e.target.value)}
                  placeholder="noreply@example.com"
                />
              </Field>
              <Field label="From Name" hint="Sender display name.">
                <input
                  style={inputStyle}
                  value={String(v.smtpFromName ?? 'VARKA')}
                  onChange={(e) => set('smtpFromName', e.target.value)}
                />
              </Field>
              <Field label="Use TLS/SSL" hint="Enable secure connection.">
                <Toggle
                  checked={Boolean(v.smtpSecure)}
                  onChange={(val) => set('smtpSecure', val)}
                  label="Secure connection"
                />
              </Field>
            </>
          ) : null}
        </>
      )}
    </SettingsForm>
  );
}
