'use client';

import { Field, SettingsForm, inputStyle } from '@/components/settings/settings-form';
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
  thumbnailWidth: 150,
  thumbnailHeight: 150,
  thumbnailCrop: true,
  mediumWidth: 300,
  mediumHeight: 300,
  largeWidth: 1024,
  largeHeight: 1024,
  organizeByYearMonth: true,
  storage_driver: '',
};

export default function MediaSettingsPage() {
  const { t } = useMessages();
  return (
    <SettingsForm
      group="media"
      title={L(t, 'mediaTitle', 'Media Settings')}
      description={L(t, 'mediaDesc', 'Image size limits and upload folder organization (WordPress-style).')}
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <h2 style={{ fontSize: 15, margin: 0 }}>{L(t, 'imageSizes', 'Image sizes')}</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            {L(t, 'imageSizesDesc', 'Maximum dimensions in pixels when adding an image to the Media Library. Original file is kept; derivatives follow these sizes.')}
          </p>
          <Field label={L(t, 'thumbnailSize', 'Thumbnail size')}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13 }}>
                {L(t, 'width', 'Width')}{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.thumbnailWidth ?? 150)}
                  onChange={(e) => set('thumbnailWidth', Number(e.target.value))}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                {L(t, 'height', 'Height')}{' '}
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
              {L(t, 'cropThumbnail', 'Crop thumbnail to exact dimensions')}
            </label>
          </Field>
          <Field label={L(t, 'mediumSize', 'Medium size')}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13 }}>
                {L(t, 'maxWidth', 'Max Width')}{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.mediumWidth ?? 300)}
                  onChange={(e) => set('mediumWidth', Number(e.target.value))}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                {L(t, 'maxHeight', 'Max Height')}{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.mediumHeight ?? 300)}
                  onChange={(e) => set('mediumHeight', Number(e.target.value))}
                />
              </label>
            </div>
          </Field>
          <Field label={L(t, 'largeSize', 'Large size')}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13 }}>
                {L(t, 'maxWidth', 'Max Width')}{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.largeWidth ?? 1024)}
                  onChange={(e) => set('largeWidth', Number(e.target.value))}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                {L(t, 'maxHeight', 'Max Height')}{' '}
                <input
                  type="number"
                  style={{ ...inputStyle, maxWidth: 90 }}
                  value={Number(v.largeHeight ?? 1024)}
                  onChange={(e) => set('largeHeight', Number(e.target.value))}
                />
              </label>
            </div>
          </Field>
          <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'uploadingFiles', 'Uploading Files')}</h2>
          <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={Boolean(v.organizeByYearMonth)}
              onChange={(e) => set('organizeByYearMonth', e.target.checked)}
            />
            {L(t, 'organizeUploads', 'Organize my uploads into month- and year-based folders')}
          </label>
          <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'storageDriver', 'Storage Driver')}</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            {L(t, 'storageDriverDesc', 'Where uploaded media is stored. Credentials stay in .env (S3_* / R2_* / GITHUB_*) — this only picks which driver is active.')}
          </p>
          <Field label={L(t, 'activeStorage', 'Active storage')}>
            <select
              style={{ ...inputStyle, width: '100%', maxWidth: 320 }}
              value={String(v.storage_driver ?? '')}
              onChange={(e) => set('storage_driver', e.target.value)}
            >
              <option value="">{L(t, 'useEnvDriver', 'Use STORAGE_DRIVER from .env')}</option>
              <option value="local">{L(t, 'localFolder', 'Local folder (public/uploads)')}</option>
              <option value="s3">{L(t, 'amazonS3', 'Amazon S3')}</option>
              <option value="r2">{L(t, 'cloudflareR2', 'Cloudflare R2')}</option>
              <option value="github">{L(t, 'githubRepo', 'GitHub repo (small sites only)')}</option>
            </select>
          </Field>
        </>
      )}
    </SettingsForm>
  );
}
