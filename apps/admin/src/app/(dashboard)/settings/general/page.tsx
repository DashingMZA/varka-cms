'use client';

import { Field, SettingsForm, inputStyle, selectStyle } from '@/components/settings/settings-form';

const DEFAULTS = {
  siteTitle: 'VARKA',
  tagline: '',
  adminEmail: '',
  membership: false,
  defaultRole: 'subscriber',
  siteLanguage: 'en',
  timezone: 'UTC',
  dateFormat: 'F j, Y',
  timeFormat: 'g:i a',
  weekStartsOn: 'monday',
  siteUrl: '',
  homeUrl: '',
};

export default function GeneralSettingsPage() {
  return (
    <SettingsForm
      group="general"
      title="General Settings"
      description="Site identity, URLs, language, timezone, and date/time formats — WordPress-style."
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field label="Site Title">
            <input
              style={inputStyle}
              value={String(v.siteTitle ?? '')}
              onChange={(e) => set('siteTitle', e.target.value)}
            />
          </Field>
          <Field label="Tagline" hint="In a few words, explain what this site is about.">
            <input
              style={inputStyle}
              value={String(v.tagline ?? '')}
              onChange={(e) => set('tagline', e.target.value)}
            />
          </Field>
          <Field label="Administration Email Address">
            <input
              type="email"
              style={inputStyle}
              value={String(v.adminEmail ?? '')}
              onChange={(e) => set('adminEmail', e.target.value)}
            />
          </Field>
          <Field label="Site Address (URL)">
            <input
              style={inputStyle}
              value={String(v.siteUrl ?? '')}
              onChange={(e) => set('siteUrl', e.target.value)}
              placeholder="https://example.com"
            />
          </Field>
          <Field label="Home URL" hint="Usually same as Site Address unless WP is in a subdirectory.">
            <input
              style={inputStyle}
              value={String(v.homeUrl ?? '')}
              onChange={(e) => set('homeUrl', e.target.value)}
            />
          </Field>
          <Field label="Membership">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={Boolean(v.membership)}
                onChange={(e) => set('membership', e.target.checked)}
              />
              Anyone can register
            </label>
          </Field>
          <Field label="New User Default Role">
            <select
              style={selectStyle}
              value={String(v.defaultRole ?? 'subscriber')}
              onChange={(e) => set('defaultRole', e.target.value)}
            >
              <option value="subscriber">Subscriber</option>
              <option value="author">Author</option>
              <option value="editor">Editor</option>
              <option value="admin">Administrator</option>
            </select>
          </Field>
          <Field label="Site Language">
            <select
              style={selectStyle}
              value={String(v.siteLanguage ?? 'en')}
              onChange={(e) => set('siteLanguage', e.target.value)}
            >
              <option value="en">English</option>
              <option value="ur">Urdu</option>
              <option value="pa">Punjabi</option>
            </select>
          </Field>
          <Field label="Timezone">
            <select
              style={selectStyle}
              value={String(v.timezone ?? 'UTC')}
              onChange={(e) => set('timezone', e.target.value)}
            >
              <option value="UTC">UTC+0</option>
              <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </Field>
          <Field label="Date Format">
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
          <Field label="Time Format">
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
          <Field label="Week Starts On">
            <select
              style={selectStyle}
              value={String(v.weekStartsOn ?? 'monday')}
              onChange={(e) => set('weekStartsOn', e.target.value)}
            >
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
