'use client';

import { Field, SettingsForm, inputStyle, selectStyle } from '@/components/settings/settings-form';
import { useMessages } from '@/lib/i18n';
import { ROLES } from '@varka/permissions';

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4321';

const DEFAULTS = {
  siteTitle: 'VARKA',
  tagline: '',
  adminEmail: '',
  membership: false,
  defaultRole: 'reader',
  siteLanguage: 'en',
  timezone: 'UTC',
  dateFormat: 'F j, Y',
  timeFormat: 'g:i a',
  weekStartsOn: 'monday',
  siteIcon: '',
};

/** Browser-supported IANA zones; common ones first for admin UX */
function listTimeZones(): string[] {
  let zones: string[] = [];
  try {
    zones =
      (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.(
        'timeZone',
      ) ?? [];
  } catch {
    zones = [];
  }
  const preferred = [
    'UTC',
    'Asia/Karachi',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Riyadh',
    'Europe/London',
    'Europe/Paris',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Australia/Sydney',
  ];
  if (!zones.length) return preferred;
  const set = new Set(zones);
  const head = preferred.filter((z) => set.has(z));
  const rest = zones.filter((z) => !preferred.includes(z));
  return [...head, ...rest];
}

const TIMEZONES = listTimeZones();

const WEEK_DAYS = [
  { id: 'sunday', label: 'Sunday' },
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
];

const requiredMark = <span style={{ color: '#d63638' }}> *</span>;

export default function GeneralSettingsPage() {
  const { t } = useMessages();
  return (
    <SettingsForm
      group="general"
      title={t('settings', 'generalTitle')}
      description={t('settings', 'generalDesc')}
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field
            label={<>Site Title{requiredMark}</>}
            hint="In a few words, explain what this site is about. Example: “Just another VARKA site.”"
          >
            <input
              style={inputStyle}
              value={String(v.siteTitle ?? '')}
              onChange={(e) => set('siteTitle', e.target.value)}
              required
            />
          </Field>
          <Field
            label="Tagline"
            hint="In a few words, explain what this site is about. Example: “Just another VARKA site.”"
          >
            <input
              style={inputStyle}
              value={String(v.tagline ?? '')}
              onChange={(e) => set('tagline', e.target.value)}
            />
          </Field>
          <Field
            label="Site Icon"
            hint="The Site Icon is what you see in browser tabs, bookmark bars, and within the VARKA mobile apps. It should be square and at least 512 by 512 pixels."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {v.siteIcon ? (
                <img
                  src={String(v.siteIcon)}
                  alt="Site icon"
                  style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 8,
                    border: '1px dashed #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: 12,
                  }}
                >
                  No icon
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <label className="v-btn" style={{ cursor: 'pointer', margin: 0 }}>
                  Change Site Icon
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => set('siteIcon', String(ev.target?.result || ''));
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {v.siteIcon ? (
                  <button
                    type="button"
                    className="v-btn"
                    style={{ color: '#d63638', borderColor: '#d63638' }}
                    onClick={() => set('siteIcon', '')}
                  >
                    Remove Site Icon
                  </button>
                ) : null}
              </div>
            </div>
          </Field>
          <Field
            label="Admin Address (URL)"
            hint="Set in .env as NEXT_PUBLIC_ADMIN_URL. Not changeable from dashboard."
          >
            <input
              style={{ ...inputStyle, background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
              value={ADMIN_URL}
              readOnly
              disabled
            />
          </Field>
          <Field
            label="Front Site Address (URL)"
            hint="Set in .env as NEXT_PUBLIC_SITE_URL. Not changeable from dashboard."
          >
            <input
              style={{ ...inputStyle, background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
              value={SITE_URL}
              readOnly
              disabled
            />
          </Field>
          <Field
            label={<>Administration Email Address{requiredMark}</>}
            hint="This address is used for admin purposes. If you change this, an email will be sent to your new address to confirm it. The new address will not become active until confirmed."
          >
            <input
              type="email"
              style={inputStyle}
              value={String(v.adminEmail ?? '')}
              onChange={(e) => set('adminEmail', e.target.value)}
              required
            />
          </Field>
          <Field label="Membership" hint="Allow new users to register on this site.">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={Boolean(v.membership)}
                onChange={(e) => set('membership', e.target.checked)}
              />
              Anyone can register
            </label>
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
          <Field label="Site Language" hint="The language used for the admin interface.">
            <select
              style={selectStyle}
              value={String(v.siteLanguage ?? 'en')}
              onChange={(e) => set('siteLanguage', e.target.value)}
            >
              <option value="en">English</option>
              <option value="ur">اردو</option>
              <option value="ar">العربية</option>
              <option value="es">Español</option>
            </select>
          </Field>
          <Field label="Timezone" hint="Choose a city in the same timezone as you.">
            <select
              style={selectStyle}
              value={String(v.timezone ?? 'UTC')}
              onChange={(e) => set('timezone', e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date Format" hint="The format used for displaying dates.">
            <select
              style={selectStyle}
              value={String(v.dateFormat ?? 'F j, Y')}
              onChange={(e) => set('dateFormat', e.target.value)}
            >
              <option value="F j, Y">September 17, 2026</option>
              <option value="Y-m-d">2026-09-17</option>
              <option value="m/d/Y">09/17/2026</option>
              <option value="d/m/Y">17/09/2026</option>
            </select>
          </Field>
          <Field label="Time Format" hint="The format used for displaying times.">
            <select
              style={selectStyle}
              value={String(v.timeFormat ?? 'g:i a')}
              onChange={(e) => set('timeFormat', e.target.value)}
            >
              <option value="g:i a">7:51 pm</option>
              <option value="g:i A">7:51 PM</option>
              <option value="H:i">19:51</option>
            </select>
          </Field>
          <Field label="Week Starts On" hint="The day the week starts on for calendar views.">
            <select
              style={selectStyle}
              value={String(v.weekStartsOn ?? 'monday')}
              onChange={(e) => set('weekStartsOn', e.target.value)}
            >
              {WEEK_DAYS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
