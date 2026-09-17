'use client';

import { Field, SettingsForm, inputStyle, selectStyle } from '@/components/settings/settings-form';

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
  return (
    <SettingsForm
      group="writing"
      title="Writing Settings"
      description="Default category, editor, and optional post-via-email."
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field label="Default Post Category">
            <input
              style={inputStyle}
              value={String(v.defaultCategory ?? '')}
              onChange={(e) => set('defaultCategory', e.target.value)}
            />
          </Field>
          <Field label="Default Post Format">
            <select
              style={selectStyle}
              value={String(v.defaultPostFormat ?? 'standard')}
              onChange={(e) => set('defaultPostFormat', e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="aside">Aside</option>
              <option value="gallery">Gallery</option>
              <option value="link">Link</option>
              <option value="image">Image</option>
              <option value="quote">Quote</option>
              <option value="status">Status</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </Field>
          <Field label="Default editor for all users">
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input
                type="radio"
                checked={v.defaultEditor === 'tiptap'}
                onChange={() => set('defaultEditor', 'tiptap')}
              />
              Block / rich editor (Tiptap)
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="radio"
                checked={v.defaultEditor === 'markdown'}
                onChange={() => set('defaultEditor', 'markdown')}
              />
              Markdown
            </label>
          </Field>
          <Field label="Allow users to switch editors">
            <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <input
                type="radio"
                checked={v.allowEditorSwitch === true}
                onChange={() => set('allowEditorSwitch', true)}
              />
              Yes
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 14, marginTop: 6 }}>
              <input
                type="radio"
                checked={!v.allowEditorSwitch}
                onChange={() => set('allowEditorSwitch', false)}
              />
              No
            </label>
          </Field>
          <h2 style={{ fontSize: 16, margin: '12px 0 0' }}>Post via email</h2>
          <Field label="Mail Server">
            <input
              style={inputStyle}
              value={String(v.mailServer ?? '')}
              onChange={(e) => set('mailServer', e.target.value)}
              placeholder="mail.example.com"
            />
          </Field>
          <Field label="Port">
            <input
              type="number"
              style={{ ...inputStyle, maxWidth: 100 }}
              value={Number(v.mailPort ?? 110)}
              onChange={(e) => set('mailPort', Number(e.target.value))}
            />
          </Field>
          <Field label="Login Name">
            <input
              style={inputStyle}
              value={String(v.mailLogin ?? '')}
              onChange={(e) => set('mailLogin', e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              style={inputStyle}
              value={String(v.mailPassword ?? '')}
              onChange={(e) => set('mailPassword', e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Update Services" hint="One URL per line — notified on publish.">
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
