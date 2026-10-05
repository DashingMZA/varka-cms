'use client';

import { useEffect, useState } from 'react';
import { Field, SettingsForm, inputStyle } from '@/components/settings/settings-form';
import { listPagesAction } from '@/actions/pages';
import { useMessages } from '@/lib/i18n';

function L(t: (ns: 'settings' | 'common', key: string) => string, key: string, fallback: string): string {
  const v = t('settings', key);
  if (!v || v === key || v.startsWith('settings.')) return fallback;
  return v;
}

const DEFAULTS = {
  privacyPolicyPage: '',
  showPrivacyInFooter: true,
  dataExportEnabled: true,
  dataErasureEnabled: true,
};

type PageOption = { id: string; title: string };

export default function PrivacySettingsPage() {
  const { t } = useMessages();
  const [pages, setPages] = useState<PageOption[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPagesAction({ limit: 100 });
        if (res.ok) {
          const data = res.data as { items?: Array<{ id: string; title: string }> };
          setPages((data.items ?? []).map((p) => ({ id: p.id, title: p.title })));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <SettingsForm
      group="privacy"
      title={L(t, 'privacyTitle', 'Privacy Settings')}
      description={L(t, 'privacyDesc', 'Privacy policy page and personal data request options.')}
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field label={L(t, 'privacyPolicyPage', 'Privacy Policy page')} hint={L(t, 'privacyPolicyHint', 'Select the page used as the privacy policy.')}>
            <select
              style={inputStyle}
              value={String(v.privacyPolicyPage ?? '')}
              onChange={(e) => set('privacyPolicyPage', e.target.value)}
            >
              <option value="">{L(t, 'selectPage', '— Select —')}</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label={L(t, 'footerLink', 'Footer link')}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={Boolean(v.showPrivacyInFooter)}
                onChange={(e) => set('showPrivacyInFooter', e.target.checked)}
              />
              {L(t, 'showPrivacyFooter', 'Show privacy policy link in footer')}
            </label>
          </Field>
          <Field label={L(t, 'dataExport', 'Personal data export')}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={Boolean(v.dataExportEnabled)}
                onChange={(e) => set('dataExportEnabled', e.target.checked)}
              />
              {L(t, 'allowDataExport', 'Allow personal data export requests')}
            </label>
          </Field>
          <Field label={L(t, 'dataErasure', 'Personal data erasure')}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={Boolean(v.dataErasureEnabled)}
                onChange={(e) => set('dataErasureEnabled', e.target.checked)}
              />
              {L(t, 'allowDataErasure', 'Allow personal data erasure requests')}
            </label>
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
