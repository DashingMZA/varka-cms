'use client';

import { Field, SettingsForm, inputStyle, selectStyle } from '@/components/settings/settings-form';
import { useMessages } from '@/lib/i18n';

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
          <Field label={t('settings', 'siteTitle')}>
            <input
              style={inputStyle}
              value={String(v.siteTitle ?? '')}
              onChange={(e) => set('siteTitle', e.target.value)}
            />
          </Field>
          <Field label={t('settings', 'tagline')} hint={t('settings', 'taglineHint')}>
            <input
              style={inputStyle}
              value={String(v.tagline ?? '')}
              onChange={(e) => set('tagline', e.target.value)}
            />
          </Field>
          <Field label={t('settings', 'adminEmail')}>
            <input
              type="email"
              style={inputStyle}
              value={String(v.adminEmail ?? '')}
              onChange={(e) => set('adminEmail', e.target.value)}
            />
          </Field>
          <Field label={t('settings', 'siteUrl')}>
            <input
              style={inputStyle}
              value={String(v.siteUrl ?? '')}
              onChange={(e) => set('siteUrl', e.target.value)}
              placeholder="https://example.com"
            />
          </Field>
          <Field label={t('settings', 'homeUrl')} hint={t('settings', 'homeUrlHint')}>
            <input
              style={inputStyle}
              value={String(v.homeUrl ?? '')}
              onChange={(e) => set('homeUrl', e.target.value)}
            />
          </Field>
          <Field label={t('settings', 'membership')}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={Boolean(v.membership)}
                onChange={(e) => set('membership', e.target.checked)}
              />
              {t('settings', 'membershipAnyone')}
            </label>
          </Field>
          <Field label={t('settings', 'defaultRole')}>
            <select
              style={selectStyle}
              value={String(v.defaultRole ?? 'subscriber')}
              onChange={(e) => set('defaultRole', e.target.value)}
            >
              <option value="subscriber">{t('settings', 'roleSubscriber')}</option>
              <option value="author">{t('settings', 'roleAuthor')}</option>
              <option value="editor">{t('settings', 'roleEditor')}</option>
              <option value="admin">{t('settings', 'roleAdmin')}</option>
            </select>
          </Field>
          <Field label={t('settings', 'siteLanguage')}>
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
          <Field label={t('settings', 'timezone')}>
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
          <Field label={t('settings', 'dateFormat')}>
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
          <Field label={t('settings', 'timeFormat')}>
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
          <Field label={t('settings', 'weekStartsOn')}>
            <select
              style={selectStyle}
              value={String(v.weekStartsOn ?? 'monday')}
              onChange={(e) => set('weekStartsOn', e.target.value)}
            >
              <option value="sunday">{t('settings', 'sunday')}</option>
              <option value="monday">{t('settings', 'monday')}</option>
            </select>
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
