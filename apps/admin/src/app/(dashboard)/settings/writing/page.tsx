'use client';

import { Field, SettingsForm, inputStyle, selectStyle } from '@/components/settings/settings-form';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'settings' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('settings', key);
  if (!v || v === key || v.startsWith('settings.')) return fallback;
  return v;
}

const DEFAULTS = {
  defaultCategory: 'uncategorized',
  defaultPostFormat: 'standard',
  defaultEditor: 'tiptap',
  allowEditorSwitch: false,
  mailServer: '',
  mailPort: 110,
  mailLogin: '',
  mailPassword: '',
  defaultMailCategory: 'uncategorized',
  updateServices: 'https://rpc.pingomatic.com/',
};

export default function WritingSettingsPage() {
  const { t } = useMessages();
  return (
    <SettingsForm
      group="writing"
      title={L(t, 'writingTitle', 'Writing Settings')}
      description={L(t, 'writingDesc', 'Default category, editor, and optional post-via-email.')}
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field label={L(t, 'defaultPostCategory', 'Default Post Category')}>
            <input
              style={inputStyle}
              value={String(v.defaultCategory ?? '')}
              onChange={(e) => set('defaultCategory', e.target.value)}
            />
          </Field>
          <Field label={L(t, 'defaultPostFormat', 'Default Post Format')}>
            <select
              style={selectStyle}
              value={String(v.defaultPostFormat ?? 'standard')}
              onChange={(e) => set('defaultPostFormat', e.target.value)}
            >
              <option value="standard">{L(t, 'formatStandard', 'Standard')}</option>
              <option value="aside">{L(t, 'formatAside', 'Aside')}</option>
              <option value="gallery">{L(t, 'formatGallery', 'Gallery')}</option>
              <option value="link">{L(t, 'formatLink', 'Link')}</option>
              <option value="image">{L(t, 'formatImage', 'Image')}</option>
              <option value="quote">{L(t, 'formatQuote', 'Quote')}</option>
              <option value="status">{L(t, 'formatStatus', 'Status')}</option>
              <option value="video">{L(t, 'formatVideo', 'Video')}</option>
              <option value="audio">{L(t, 'formatAudio', 'Audio')}</option>
            </select>
          </Field>
          <Field label={L(t, 'defaultEditor', 'Default editor for all users')}>
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input
                type="radio"
                checked={v.defaultEditor === 'tiptap'}
                onChange={() => set('defaultEditor', 'tiptap')}
              />
              {L(t, 'editorTiptap', 'Block / rich editor (Tiptap)')}
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="radio"
                checked={v.defaultEditor === 'markdown'}
                onChange={() => set('defaultEditor', 'markdown')}
              />
              {L(t, 'editorMarkdown', 'Markdown editor')}
            </label>
          </Field>
          <Field label={L(t, 'allowEditorSwitch', 'Allow users to switch editors')}>
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input
                type="radio"
                checked={v.allowEditorSwitch === true}
                onChange={() => set('allowEditorSwitch', true)}
              />
              {L(t, 'yes', 'Yes')}
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="radio"
                checked={!v.allowEditorSwitch}
                onChange={() => set('allowEditorSwitch', false)}
              />
              {L(t, 'no', 'No')}
            </label>
          </Field>
          <tr>
            <td colSpan={2} style={{ padding: '12px 0 0' }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>{L(t, 'postViaEmail', 'Post via email')}</h2>
            </td>
          </tr>
          <Field label={L(t, 'mailServer', 'Mail Server')}>
            <input
              style={inputStyle}
              value={String(v.mailServer ?? '')}
              onChange={(e) => set('mailServer', e.target.value)}
              placeholder="mail.example.com"
            />
          </Field>
          <Field label={L(t, 'mailPort', 'Port')}>
            <input
              type="number"
              style={{ ...inputStyle, maxWidth: 100 }}
              value={Number(v.mailPort ?? 110)}
              onChange={(e) => set('mailPort', Number(e.target.value))}
            />
          </Field>
          <Field label={L(t, 'mailLogin', 'Login Name')}>
            <input
              style={inputStyle}
              value={String(v.mailLogin ?? '')}
              onChange={(e) => set('mailLogin', e.target.value)}
            />
          </Field>
          <Field label={L(t, 'mailPassword', 'Password')}>
            <input
              type="password"
              style={inputStyle}
              value={String(v.mailPassword ?? '')}
              onChange={(e) => set('mailPassword', e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label={L(t, 'updateServices', 'Update Services')}>
            <textarea
              style={{ ...inputStyle, maxWidth: 480, minHeight: 80 }}
              value={String(v.updateServices ?? '')}
              onChange={(e) => set('updateServices', e.target.value)}
            />
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
