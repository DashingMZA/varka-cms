'use client';

import { Field, SettingsForm, inputStyle } from '@/components/settings/settings-form';

const DEFAULTS = {
  structure: 'day-name',
  customStructure: '/%year%/%monthnum%/%day%/%postname%/',
  categoryBase: '',
  tagBase: '',
};

const STRUCTURES: { id: string; label: string; example: string }[] = [
  { id: 'plain', label: 'Plain', example: '/?p=123' },
  { id: 'day-name', label: 'Day and name', example: '/2026/09/17/sample-post/' },
  { id: 'month-name', label: 'Month and name', example: '/2026/09/sample-post/' },
  { id: 'numeric', label: 'Numeric', example: '/archives/123' },
  { id: 'post-name', label: 'Post name', example: '/sample-post/' },
  { id: 'custom', label: 'Custom Structure', example: '/%year%/%monthnum%/%day%/%postname%/' },
];

export default function PermalinksSettingsPage() {
  return (
    <SettingsForm
      group="permalinks"
      title="Permalink Settings"
      description="Select the permalink structure for your website. Including the post name makes links easier to understand and can help SEO."
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field label="Common Settings">
            <div style={{ display: 'grid', gap: 10 }}>
              {STRUCTURES.map((s) => (
                <label
                  key={s.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr',
                    gap: 8,
                    fontSize: 14,
                    alignItems: 'start',
                  }}
                >
                  <input
                    type="radio"
                    name="permalink-structure"
                    checked={v.structure === s.id}
                    onChange={() => set('structure', s.id)}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    <strong>{s.label}</strong>
                    <br />
                    <code style={{ fontSize: 12, color: 'var(--muted)' }}>{s.example}</code>
                  </span>
                </label>
              ))}
            </div>
          </Field>
          {v.structure === 'custom' ? (
            <Field label="Custom structure">
              <input
                style={{ ...inputStyle, maxWidth: 480, fontFamily: 'monospace' }}
                value={String(v.customStructure ?? '')}
                onChange={(e) => set('customStructure', e.target.value)}
              />
            </Field>
          ) : null}
          <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>Optional</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            Custom bases for category and tag URLs. Leave blank for defaults.
          </p>
          <Field label="Category base">
            <input
              style={inputStyle}
              value={String(v.categoryBase ?? '')}
              onChange={(e) => set('categoryBase', e.target.value)}
              placeholder="topics"
            />
          </Field>
          <Field label="Tag base">
            <input
              style={inputStyle}
              value={String(v.tagBase ?? '')}
              onChange={(e) => set('tagBase', e.target.value)}
            />
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
