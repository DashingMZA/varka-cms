'use client';

import { useEffect, useState } from 'react';

export function SeoSettings() {
  const [description, setDescription] = useState('');
  const [titleTemplate, setTitleTemplate] = useState('%s · VARKA');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/seo', { credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as {
        settings: Record<string, unknown>;
        defaults: Record<string, unknown>;
      };
      const d =
        (data.settings['seo.defaultDescription'] as string) ??
        (data.defaults['seo.defaultDescription'] as string) ??
        '';
      const t =
        (data.settings['seo.titleTemplate'] as string) ??
        (data.defaults['seo.titleTemplate'] as string) ??
        '%s · VARKA';
      setDescription(typeof d === 'string' ? d : String(d ?? ''));
      setTitleTemplate(typeof t === 'string' ? t : '%s · VARKA');
    })();
  }, []);

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
      }),
    });
    if (!res.ok) {
      setError(`Save failed (${res.status})`);
      return;
    }
    setMessage('Saved');
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 520, marginTop: 16 }}>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        Title template
        <input
          value={titleTemplate}
          onChange={(e) => setTitleTemplate(e.target.value)}
          style={field}
        />
      </label>
      <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        Default description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={field}
        />
      </label>
      <button type="button" onClick={() => void save()} style={btn}>
        Save SEO defaults
      </button>
      {message ? <p style={{ color: '#15803d', margin: 0 }}>{message}</p> : null}
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>
        Public site exposes <code>/sitemap.xml</code> and <code>/robots.txt</code> via Astro.
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
