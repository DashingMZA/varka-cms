'use client';

import { useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'seo' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('seo', key);
  if (!v || v === key || v.startsWith('seo.')) return fallback;
  return v;
}

export function SeoSettings() {
  const { t } = useMessages();
  const [description, setDescription] = useState('');
  const [titleTemplate, setTitleTemplate] = useState('%s · VARKA');
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/seo', { credentials: 'include' });
      if (!res.ok) {
        setError(L(t, 'loadFailed', 'Load failed ({status})').replace('{status}', String(res.status)));
        return;
      }
      const data = (await res.json()) as {
        settings: Record<string, unknown>;
        defaults: Record<string, unknown>;
      };
      const d =
        data.settings['seo.defaultDescription'] ?? data.defaults['seo.defaultDescription'] ?? '';
      const tt =
        data.settings['seo.titleTemplate'] ?? data.defaults['seo.titleTemplate'] ?? '%s · VARKA';
      const r = data.settings['seo.robotsIndex'] ?? data.defaults['seo.robotsIndex'] ?? true;
      setDescription(typeof d === 'string' ? d : String(d ?? ''));
      setTitleTemplate(typeof tt === 'string' ? tt : '%s · VARKA');
      setRobotsIndex(r === true || r === 'true');
    })();
  }, [t]);

  async function save() {
    setMessage(null);
    setError(null);
    const res = await fetch('/api/seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        'seo.defaultDescription': description,
        'seo.titleTemplate': titleTemplate,
        'seo.robotsIndex': robotsIndex,
      }),
    });
    if (!res.ok) {
      setError(L(t, 'saveFailed', 'Save failed ({status})').replace('{status}', String(res.status)));
      return;
    }
    setMessage(L(t, 'saved', 'Saved'));
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 520, marginTop: 16 }}>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        {L(t, 'titleTemplate', 'Title template')}
        <input
          value={titleTemplate}
          onChange={(e) => setTitleTemplate(e.target.value)}
          style={field}
          placeholder="%s · VARKA"
        />
      </label>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        {L(t, 'defaultDescription', 'Default description')}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={field}
        />
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
        <input
          type="checkbox"
          checked={robotsIndex}
          onChange={(e) => setRobotsIndex(e.target.checked)}
        />
        {L(t, 'robotsIndex', 'Allow search engines to index')}
      </label>
      <button type="button" onClick={() => void save()} style={btn}>
        {L(t, 'saveDefaults', 'Save SEO defaults')}
      </button>
      {message ? <p style={{ color: '#15803d', margin: 0 }}>{message}</p> : null}
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>
        {L(t, 'publicSiteNote', 'Public site: /sitemap.xml, /robots.txt. Set PUBLIC_SITE_URL on Astro.')}
      </p>
    </div>
  );
}

const field: Record<string, string | number> = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: '#fff',
};

const btn: Record<string, string | number> = {
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
  width: 'fit-content',
};
