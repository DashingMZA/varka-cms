'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import {
  getFormAction,
  updateFormAction,
  listEntriesAction,
  deleteEntryAction,
  bulkDeleteEntriesAction,
  type FormField,
} from '@/actions/forms';
import { FORM_FIELD_TYPES } from '@/lib/form-field-types';

type Props = { formId: string; initialTab?: string };

type Entry = {
  id: string;
  data: Record<string, string>;
  ip?: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  email: 'Email',
  textarea: 'Textarea',
  select: 'Dropdown',
  radio: 'Radio buttons',
  checkbox: 'Checkboxes',
  number: 'Number',
  tel: 'Phone',
  url: 'URL',
  date: 'Date',
};

function newField(type: string): FormField {
  return {
    id: `field_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4)}`,
    type: (FORM_FIELD_TYPES as readonly string[]).includes(type) ? (type as FormField['type']) : 'text',
    label: 'Untitled field',
    required: false,
  };
}

export function FormEditor({ formId, initialTab }: Props) {
  const { t } = useMessages();
  const [tab, setTab] = useState(initialTab === 'entries' ? 'entries' : 'fields');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [submitLabel, setSubmitLabel] = useState('Send');
  const [successMessage, setSuccessMessage] = useState('');
  const [mailTo, setMailTo] = useState('');
  const [active, setActive] = useState(true);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [entriesPage, setEntriesPage] = useState(1);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFormAction(formId);
      if (!result.ok) {
        setError(t('errors', 'loadFailed') + `: ${result.error}`);
        setLoading(false);
        return;
      }
      const f = result.data as {
        name: string;
        slug: string;
        title?: string | null;
        fields: FormField[];
        submitLabel: string;
        successMessage: string;
        mailTo?: string | null;
        active: boolean;
      };
      setName(f.name);
      setSlug(f.slug);
      setTitle(f.title ?? '');
      setFields(Array.isArray(f.fields) ? f.fields : []);
      setSubmitLabel(f.submitLabel);
      setSuccessMessage(f.successMessage);
      setMailTo(f.mailTo ?? '');
      setActive(f.active);
    } catch {
      setError(t('errors', 'networkError'));
    }
    setLoading(false);
  }, [formId, t]);

  const loadEntries = useCallback(async () => {
    try {
      const result = await listEntriesAction(formId, { page: entriesPage, perPage });
      if (result.ok) {
        setEntries(result.data.items as Entry[]);
        setEntriesTotal(result.data.total);
        setSelectedEntries(new Set());
      }
    } catch {
      /* ignore */
    }
  }, [formId, entriesPage]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === 'entries') void loadEntries();
  }, [tab, loadEntries]);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await updateFormAction(formId, {
        name,
        slug,
        title: title || null,
        fields,
        submitLabel,
        successMessage,
        mailTo: mailTo || null,
        active,
      });
      if (!result.ok) {
        setError(t('errors', 'saveFailed') + `: ${result.error}`);
      } else {
        setNotice(t('forms', 'saved') || 'Form saved.');
      }
    } catch {
      setError(t('errors', 'networkError'));
    }
    setSaving(false);
  }

  function moveField(index: number, dir: -1 | 1) {
    setFields((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const a = prev[index];
      const b = prev[j];
      if (a === undefined || b === undefined) return prev;
      const next = [...prev];
      next[index] = b;
      next[j] = a;
      return next;
    });
  }

  function updateField(index: number, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function removeEntry(id: string) {
    if (!window.confirm(t('forms', 'deleteEntryConfirm') || 'Delete this entry?')) return;
    const result = await deleteEntryAction(id);
    if (result.ok) void loadEntries();
  }

  async function bulkDeleteEntries() {
    if (selectedEntries.size === 0) return;
    if (!window.confirm(t('forms', 'bulkDeleteConfirm') || 'Delete selected entries?')) return;
    const result = await bulkDeleteEntriesAction(formId, Array.from(selectedEntries));
    if (result.ok) void loadEntries();
  }

  if (loading) return <p className="v-muted">{t('common', 'loading') || 'Loading…'}</p>;
  if (error && !name)
    return (
      <p role="alert" className="v-alert v-alert--error">
        {error}
      </p>
    );

  const embedSnippet = `<form action="${typeof window !== 'undefined' ? window.location.origin : ''}/api/public/forms/${slug}/submit" method="post">\n${fields
    .map((f) => `  <!-- ${f.label} (${f.type})${f.required ? ' *' : ''} -->\n  <label>${f.label}${f.required ? ' *' : ''}<br />\n    <input type="${f.type === 'textarea' ? 'text' : f.type}" name="${f.id}"${f.required ? ' required' : ''} />\n  </label>`)
    .join('\n')}\n  <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />\n  <button type="submit">${submitLabel}</button>\n</form>`;

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">
          {t('forms', 'editForm') || 'Edit Form'} — {name}
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            {t('forms', 'active') || 'Active'}
          </label>
          <button type="button" className="v-btn v-btn--primary" disabled={saving} onClick={() => void save()}>
            {saving ? t('common', 'saving') || 'Saving…' : t('common', 'save') || 'Save'}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}
      {notice ? <p className="v-notice v-notice--success">{notice}</p> : null}

      <div className="v-tabs" style={{ marginBottom: 16 }}>
        {(['fields', 'entries', 'embed'] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={`v-tab${tab === k ? ' v-tab--active' : ''}`}
            onClick={() => setTab(k)}
          >
            {k === 'fields'
              ? t('forms', 'tabFields') || 'Fields'
              : k === 'entries'
                ? `${t('forms', 'tabEntries') || 'Entries'} (${entriesTotal})`
                : t('forms', 'tabEmbed') || 'Embed'}
          </button>
        ))}
      </div>

      {tab === 'fields' ? (
        <>
          <section className="v-card" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>{t('forms', 'settings') || 'Settings'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{t('forms', 'name') || 'Name'}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{t('forms', 'slug') || 'Slug'}</span>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{t('forms', 'formTitle') || 'Title shown above the form'}</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{t('forms', 'submitLabel') || 'Submit button label'}</span>
                <input value={submitLabel} onChange={(e) => setSubmitLabel(e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{t('forms', 'successMessage') || 'Success message'}</span>
                <input value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  {t('forms', 'mailTo') || 'Notification email'} <span className="v-muted">({t('common', 'optional') || 'optional'})</span>
                </span>
                <input value={mailTo} onChange={(e) => setMailTo(e.target.value)} placeholder="you@example.com" style={{ width: '100%' }} />
              </label>
            </div>
          </section>

          <section className="v-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ margin: 0 }}>{t('forms', 'fields') || 'Fields'} ({fields.length})</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select id="v-add-field-type" defaultValue="text">
                  {FORM_FIELD_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {TYPE_LABELS[ft] ?? ft}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="v-btn v-btn--small"
                  onClick={() => {
                    const sel = document.getElementById('v-add-field-type') as HTMLSelectElement | null;
                    setFields((prev) => [...prev, newField(sel?.value ?? 'text')]);
                  }}
                >
                  + {t('forms', 'addField') || 'Add field'}
                </button>
              </div>
            </div>

            {fields.length === 0 ? (
              <p className="v-muted">{t('forms', 'noFields') || 'No fields yet. Add one above.'}</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {fields.map((f, i) => (
                  <div key={f.id} className="v-card" style={{ margin: 0, padding: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, alignItems: 'end' }}>
                      <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{t('forms', 'fieldLabel') || 'Label'}</span>
                        <input value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} style={{ width: '100%' }} />
                      </label>
                      <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{t('forms', 'fieldType') || 'Type'}</span>
                        <select
                          value={f.type}
                          onChange={(e) => updateField(i, { type: e.target.value as FormField['type'] })}
                          style={{ width: '100%' }}
                        >
                          {FORM_FIELD_TYPES.map((ft) => (
                            <option key={ft} value={ft}>
                              {TYPE_LABELS[ft] ?? ft}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{t('forms', 'fieldId') || 'Field name (for entries)'}</span>
                        <input value={f.id} onChange={(e) => updateField(i, { id: e.target.value })} style={{ width: '100%' }} />
                      </label>
                      <label style={{ display: 'block' }}>
                        <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{t('forms', 'placeholder') || 'Placeholder'}</span>
                        <input
                          value={f.placeholder ?? ''}
                          onChange={(e) => updateField(i, { placeholder: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </label>
                      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={f.required === true}
                          onChange={(e) => updateField(i, { required: e.target.checked })}
                        />
                        {t('forms', 'required') || 'Required'}
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="v-btn v-btn--small" disabled={i === 0} onClick={() => moveField(i, -1)} aria-label="Move up">
                          ↑
                        </button>
                        <button
                          type="button"
                          className="v-btn v-btn--small"
                          disabled={i === fields.length - 1}
                          onClick={() => moveField(i, 1)}
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="v-btn v-btn--small v-btn--danger"
                          onClick={() => setFields((prev) => prev.filter((_, j) => j !== i))}
                        >
                          {t('common', 'delete') || 'Delete'}
                        </button>
                      </div>
                    </div>
                    {f.type === 'select' || f.type === 'radio' || f.type === 'checkbox' ? (
                      <label style={{ display: 'block', marginTop: 10 }}>
                        <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                          {t('forms', 'options') || 'Options (one per line)'}
                        </span>
                        <textarea
                          rows={3}
                          value={(f.options ?? []).join('\n')}
                          onChange={(e) =>
                            updateField(i, { options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })
                          }
                          style={{ width: '100%' }}
                        />
                      </label>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      {tab === 'entries' ? (
        <section className="v-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ margin: 0 }}>
              {t('forms', 'tabEntries') || 'Entries'} ({entriesTotal})
            </h2>
            <button
              type="button"
              className="v-btn v-btn--small v-btn--danger"
              disabled={selectedEntries.size === 0}
              onClick={() => void bulkDeleteEntries()}
            >
              {t('forms', 'deleteSelected') || 'Delete selected'} ({selectedEntries.size})
            </button>
          </div>
          {entries.length === 0 ? (
            <p className="v-muted">{t('forms', 'noEntries') || 'No entries yet.'}</p>
          ) : (
            <>
              <table className="v-list-table">
                <thead>
                  <tr>
                    <td className="check-column">
                      <input
                        type="checkbox"
                        checked={entries.length > 0 && selectedEntries.size === entries.length}
                        onChange={(e) =>
                          setSelectedEntries(e.target.checked ? new Set(entries.map((en) => en.id)) : new Set())
                        }
                      />
                    </td>
                    <th>{t('forms', 'entryData') || 'Submitted data'}</th>
                    <th>{t('common', 'date') || 'Date'}</th>
                    <th>{t('common', 'actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((en) => (
                    <tr key={en.id}>
                      <th className="check-column">
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(en.id)}
                          onChange={(e) =>
                            setSelectedEntries((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(en.id);
                              else next.delete(en.id);
                              return next;
                            })
                          }
                        />
                      </th>
                      <td>
                        <dl style={{ margin: 0, display: 'grid', gap: 2 }}>
                          {Object.entries(en.data ?? {}).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', gap: 8 }}>
                              <dt className="v-muted" style={{ minWidth: 120 }}>
                                {k}:
                              </dt>
                              <dd style={{ margin: 0 }}>{String(v)}</dd>
                            </div>
                          ))}
                        </dl>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(en.createdAt).toLocaleString()}</td>
                      <td>
                        <a
                          href="#"
                          className="trash"
                          onClick={(e) => {
                            e.preventDefault();
                            void removeEntry(en.id);
                          }}
                        >
                          {t('common', 'delete') || 'Delete'}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {entriesTotal > perPage ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="v-btn v-btn--small"
                    disabled={entriesPage <= 1}
                    onClick={() => setEntriesPage((p) => Math.max(1, p - 1))}
                  >
                    ← {t('common', 'previous') || 'Previous'}
                  </button>
                  <span className="v-muted" style={{ fontSize: 13 }}>
                    {t('common', 'page') || 'Page'} {entriesPage} {t('common', 'of') || 'of'}{' '}
                    {Math.ceil(entriesTotal / perPage)}
                  </span>
                  <button
                    type="button"
                    className="v-btn v-btn--small"
                    disabled={entriesPage >= Math.ceil(entriesTotal / perPage)}
                    onClick={() => setEntriesPage((p) => p + 1)}
                  >
                    {t('common', 'next') || 'Next'} →
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {tab === 'embed' ? (
        <section className="v-card">
          <h2 style={{ marginTop: 0 }}>{t('forms', 'embedTitle') || 'Use this form on your site'}</h2>
          <p className="v-muted">
            {t('forms', 'embedShortcodeHelp') || 'Shortcode (for VARKA themes and page content):'}
          </p>
          <p>
            <code>[varka-form slug=&quot;{slug}&quot;]</code>
          </p>
          <p className="v-muted">{t('forms', 'embedHtmlHelp') || 'Or paste this plain HTML form anywhere (works on any site):'}</p>
          <textarea readOnly rows={Math.min(20, embedSnippet.split('\n').length + 1)} value={embedSnippet} style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }} />
          <p className="v-muted" style={{ marginTop: 8 }}>
            {t('forms', 'embedNote') ||
              'Submissions are stored as Entries here. The hidden "website" field is a spam trap — leave it in place.'}
          </p>
        </section>
      ) : null}
    </div>
  );
}
