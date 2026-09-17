'use client';

import { Field, SettingsForm, inputStyle } from '@/components/settings/settings-form';

const DEFAULTS = {
  thumbnailWidth: 150,
  thumbnailHeight: 150,
  thumbnailCrop: true,
  mediumWidth: 300,
  mediumHeight: 300,
  largeWidth: 1024,
  largeHeight: 1024,
  organizeByYearMonth: true,
};

export default function MediaSettingsPage() {
  return (
    <SettingsForm
      group="media"
      title="Media Settings"
      description="Image size limits and upload folder organization (WordPress-style)."
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <h2 style={{ fontSize: 15, margin: 0 }}>Image sizes</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            Maximum dimensions in pixels when adding an image to the Media Library. Original file is
            kept; derivatives follow these sizes.
          </p>
          <Field label="Thumbnail size">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13 }}>
                Width{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.thumbnailWidth ?? 150)}
                  onChange={(e) => set('thumbnailWidth', Number(e.target.value))}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                Height{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.thumbnailHeight ?? 150)}
                  onChange={(e) => set('thumbnailHeight', Number(e.target.value))}
                />
              </label>
            </div>
            <label style={{ display: 'flex', gap: 8, fontSize: 13, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={Boolean(v.thumbnailCrop)}
                onChange={(e) => set('thumbnailCrop', e.target.checked)}
              />
              Crop thumbnail to exact dimensions
            </label>
          </Field>
          <Field label="Medium size">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13 }}>
                Max Width{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.mediumWidth ?? 300)}
                  onChange={(e) => set('mediumWidth', Number(e.target.value))}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                Max Height{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.mediumHeight ?? 300)}
                  onChange={(e) => set('mediumHeight', Number(e.target.value))}
                />
              </label>
            </div>
          </Field>
          <Field label="Large size">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13 }}>
                Max Width{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.largeWidth ?? 1024)}
                  onChange={(e) => set('largeWidth', Number(e.target.value))}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                Max Height{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.largeHeight ?? 1024)}
                  onChange={(e) => set('largeHeight', Number(e.target.value))}
                />
              </label>
            </div>
          </Field>
          <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>Uploading Files</h2>
          <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={Boolean(v.organizeByYearMonth)}
              onChange={(e) => set('organizeByYearMonth', e.target.checked)}
            />
            Organize my uploads into month- and year-based folders
          </label>
        </>
      )}
    </SettingsForm>
  );
}
