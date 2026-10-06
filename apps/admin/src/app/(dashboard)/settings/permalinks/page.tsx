'use client';

import { Field, SettingsForm, inputStyle } from '@/components/settings/settings-form';
import { useMessages } from '@/lib/i18n';

function L(t: (ns: 'settings' | 'common', key: string) => string, key: string, fallback: string): string {
  const v = t('settings', key);
  if (!v || v === key || v.startsWith('settings.')) return fallback;
  return v;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4321').replace(/\/$/, '');

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
  const STRUCTURES = [
    { id: 'plain', label: L(t, 'structurePlain', 'Plain'), example: '/?p=123' },
    { id: 'day-name', label: L(t, 'structureDayName', 'Day and name'), example: '/2026/10/06/sample-post/' },
    { id: 'month-name', label: L(t, 'structureMonthName', 'Month and name'), example: '/2026/10/sample-post/' },
    { id: 'numeric', label: L(t, 'structureNumeric', 'Numeric'), example: '/archives/123' },
    { id: 'post-name', label: L(t, 'structurePostName', 'Post name'), example: '/sample-post/' },
    { id: 'custom', label: L(t, 'structureCustom', 'Custom Structure'), example: null },
  ];
  return (
    <SettingsForm
      group="permalinks"
      title={L(t, 'permalinksTitle', 'Permalink Settings')}
      description={L(t, 'permalinksDesc', 'VARKA offers you the ability to create a custom URL structure for your permalinks and archives. Custom URL structures can improve the aesthetics, usability, and forward-compatibility of your links. A number of tags are available, and here are some examples to get you started.')}
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 8px' }}>{L(t, 'commonSettings', 'Common Settings')}</h2>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
                {L(t, 'commonSettingsDesc', 'Select the permalink structure for your website. Including the %postname% tag makes links easy to understand, and can help your posts rank higher in search engines.')}
              </p>
            </td>
          </tr>
          <tr>
            <th scope="row" style={{ verticalAlign: 'top', paddingTop: 8 }}>
              {L(t, 'permalinkStructure', 'Permalink structure')}
            </th>
            <td>
              <div style={{ display: 'grid', gap: 14 }}>
                {STRUCTURES.map((s) => (
                  <label
                    key={s.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '20px 1fr',
                      gap: 8,
                      fontSize: 14,
                      alignItems: 'start',
                      cursor: 'pointer',
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
                      {s.id === 'custom' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          <code style={{ fontSize: 12, color: 'var(--muted)', background: '#f3f4f6', padding: '4px 8px', borderRadius: 4 }}>
                            {SITE_URL}
                          </code>
                          <input
                            style={{ ...inputStyle, maxWidth: 320, fontFamily: 'monospace', margin: 0 }}
                            value={String(v.customStructure ?? '')}
                            onChange={(e) => set('customStructure', e.target.value)}
                            id="custom-structure-input"
                            placeholder="/%postname%/"
                          />
                        </span>
                      ) : (
                        <code style={{ fontSize: 12, color: 'var(--muted)', background: '#f3f4f6', padding: '4px 8px', borderRadius: 4 }}>
                          {SITE_URL}{s.example}
                        </code>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              <p style={{ margin: '16px 0 8px', fontSize: 13 }}>
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
                      if (current.includes(tag)) return;
                      const input = document.getElementById('custom-structure-input') as HTMLInputElement | null;
                      if (input && input.selectionStart !== null) {
                        const start = input.selectionStart;
                        const end = input.selectionEnd ?? start;
                        const next = current.slice(0, start) + tag + current.slice(end);
                        set('customStructure', next);
                        set('structure', 'custom');
                        requestAnimationFrame(() => {
                          input.focus();
                          const pos = start + tag.length;
                          input.setSelectionRange(pos, pos);
                        });
                      } else {
                        set('customStructure', current + tag);
                        set('structure', 'custom');
                      }
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>{L(t, 'optional', 'Optional')}</h2>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
                {L(t, 'optionalDesc', `If you like, you may enter custom structures for your category and tag URLs here. For example, using topics as your category base would make your category links like ${SITE_URL}/topics/uncategorized/. If you leave these blank the defaults will be used.`)}
              </p>
            </td>
          </tr>
          <Field label={L(t, 'categoryBase', 'Category base')}>
            <input
              style={{ ...inputStyle, maxWidth: 320 }}
              value={String(v.categoryBase ?? '')}
              onChange={(e) => set('categoryBase', e.target.value)}
              placeholder="topics"
            />
          </Field>
          <Field label={L(t, 'tagBase', 'Tag base')}>
            <input
              style={{ ...inputStyle, maxWidth: 320 }}
              value={String(v.tagBase ?? '')}
              onChange={(e) => set('tagBase', e.target.value)}
            />
          </Field>
          <tr>
            <td colSpan={2}>
              <div
                style={{
                  background: '#fefce8',
                  border: '1px solid #fde68a',
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: 6,
                  padding: '12px 16px',
                  margin: '16px 0',
                  fontSize: 13,
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <span style={{ flex: 1 }}>
                  <strong>Warning:</strong> {L(t, 'permalinkWarning', 'Changing the permalinks on a live, indexed site may result in serious loss of traffic if done incorrectly. Consider adding a new redirection from the old URL format to the new one.')}
                </span>
                <button
                  type="button"
                  onClick={(e) => { (e.target as HTMLElement).closest('div')!.style.display = 'none'; }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#92400e', padding: 0 }}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            </td>
          </tr>
        </>
      )}
    </SettingsForm>
  );
}
