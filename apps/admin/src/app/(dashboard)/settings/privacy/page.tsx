'use client';

import { Field, SettingsForm, inputStyle } from '@/components/settings/settings-form';

const DEFAULTS = {
  privacyPolicyPage: '',
  showPrivacyInFooter: true,
  dataExportEnabled: true,
  dataErasureEnabled: true,
};

export default function PrivacySettingsPage() {
  return (
    <SettingsForm
      group="privacy"
      title="Privacy Settings"
      description="Privacy policy page and personal data request options."
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <Field label="Privacy Policy page" hint="Slug of the page used as the privacy policy.">
            <input
              style={inputStyle}
              value={String(v.privacyPolicyPage ?? '')}
              onChange={(e) => set('privacyPolicyPage', e.target.value)}
              placeholder="privacy-policy"
            />
          </Field>
          <Field label="Footer link">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={Boolean(v.showPrivacyInFooter)}
                onChange={(e) => set('showPrivacyInFooter', e.target.checked)}
              />
              Show privacy policy link in footer
            </label>
          </Field>
          <Field label="Personal data export">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={Boolean(v.dataExportEnabled)}
                onChange={(e) => set('dataExportEnabled', e.target.checked)}
              />
              Allow personal data export requests
            </label>
          </Field>
          <Field label="Personal data erasure">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={Boolean(v.dataErasureEnabled)}
                onChange={(e) => set('dataErasureEnabled', e.target.checked)}
              />
              Allow personal data erasure requests
            </label>
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
