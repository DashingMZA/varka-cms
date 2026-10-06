'use client';

import { Field, SettingsForm, inputStyle } from '@/components/settings/settings-form';
import { useMessages } from '@/lib/i18n';

function L(t: (ns: 'settings' | 'common', key: string) => string, key: string, fallback: string): string {
  const v = t('settings', key);
  if (!v || v === key || v.startsWith('settings.')) return fallback;
  return v;
}

const DEFAULTS = {
  structure: 'day-name',
  customStructure: '/%year%/%monthnum%/%day%/%postname%/',
  categoryBase: '',
  tagBase: '',
};

const AVAILABLE_TAGS = [
  '%year%',
  '%monthnum%',
  '%day%',
  '%hour%',
  '%minute%',
  '%second%',
  '%post_id%',
  '%postname%',
  '%category%',
  '%author%',
];


export default function PermalinksSettingsPage() {
  const { t } = useMessages();
  const STRUCTURES_T = [
    { id: 'plain', label: L(t, 'structurePlain', 'Plain'), example: '/?p=123' },
    { id: 'day-name', label: L(t, 'structureDayName', 'Day and name'), example: '/2026/09/17/sample-post/' },
    { id: 'month-name', label: L(t, 'structureMonthName', 'Month and name'), example: '/2026/09/sample-post/' },
    { id: 'numeric', label: L(t, 'structureNumeric', 'Numeric'), example: '/archives/123' },
    { id: 'post-name', label: L(t, 'structurePostName', 'Post name'), example: '/sample-post/' },
    { id: 'custom', label: L(t, 'structureCustom', 'Custom Structure'), example: '/%year%/%monthnum%/%day%/%postname%/' },
  ];
  return (
    <SettingsForm
      group="permalinks"
      title={L(t, 'permalinksTitle', 'Permalink Settings')}
      description={L(t, 'permalinksDesc', 'Select the permalink structure for your website.')}
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field label={L(t, 'commonSettings', 'Common Settings')}>
            <div style={{ display: 'grid', gap: 10 }}>
              {STRUCTURES_T.map((s) => (
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
            <Field label={L(t, 'customStructure', 'Custom structure')}>
              <input
                style={{ ...inputStyle, maxWidth: 480, fontFamily: 'monospace' }}
                value={String(v.customStructure ?? '')}
                onChange={(e) => set('customStructure', e.target.value)}
                id="custom-structure-input"
              />
              <p style={{ margin: '8px 0 4px', fontSize: 13 }}>
                {L(t, 'availableTags', 'Available tags:')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="v-btn"
                    style={{ fontSize: 12, fontFamily: 'monospace' }}
                    onClick={() => {
                      const current = String(v.customStructure ?? '');
                      // Each tag applies only once — skip if already present
                      if (current.includes(tag)) return;
                      const input = document.getElementById('custom-structure-input') as HTMLInputElement | null;
                      if (input && input.selectionStart !== null) {
                        const start = input.selectionStart;
                        const end = input.selectionEnd ?? start;
                        const next = current.slice(0, start) + tag + current.slice(end);
                        set('customStructure', next);
                        requestAnimationFrame(() => {
                          input.focus();
                          const pos = start + tag.length;
                          input.setSelectionRange(pos, pos);
                        });
                      } else {
                        set('customStructure', current + tag);
                      }
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </Field>
          ) : null}
          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'optional', 'Optional')}</h2>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                {L(t, 'optionalDesc', 'Custom bases for category and tag URLs. Leave blank for defaults.')}
              </p>
            </td>
          </tr>
          <Field label={L(t, 'categoryBase', 'Category base')}>
            <input
              style={inputStyle}
              value={String(v.categoryBase ?? '')}
              onChange={(e) => set('categoryBase', e.target.value)}
              placeholder="topics"
            />
          </Field>
          <Field label={L(t, 'tagBase', 'Tag base')}>
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
