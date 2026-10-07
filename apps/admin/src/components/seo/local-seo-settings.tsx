'use client';

import { useEffect, useState } from 'react';
import { getSeoSettingsAction, saveSeoSettingsAction } from '@/actions/seo-tools';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

type DayHours = { closed: boolean; open: string; close: string };

function parseHours(raw: string): Record<string, DayHours> {
  const defaults: Record<string, DayHours> = {};
  for (const d of DAYS) defaults[d] = { closed: d === 'saturday' || d === 'sunday', open: '09:00', close: '17:00' };
  try {
    const parsed = JSON.parse(raw || '{}');
    for (const d of DAYS) {
      if (parsed[d]) defaults[d] = { ...defaults[d], ...parsed[d] };
    }
  } catch { /* ignore */ }
  return defaults;
}

function HoursEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hours = parseHours(value);
  const setDay = (d: string, patch: Partial<DayHours>) =>
    onChange(JSON.stringify({ ...hours, [d]: { ...hours[d], ...patch } }));
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      {DAYS.map((d) => (
        <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
          <span style={{ width: 90, fontWeight: 500 }}>{DAY_LABELS[d]}</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <input type="checkbox" checked={hours[d]!.closed} onChange={(e) => setDay(d, { closed: e.target.checked })} /> Closed
          </label>
          {!hours[d]!.closed && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <input type="time" value={hours[d]!.open} onChange={(e) => setDay(d, { open: e.target.value })} />
              to
              <input type="time" value={hours[d]!.close} onChange={(e) => setDay(d, { close: e.target.value })} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Local SEO — ported from BMS-CMS. */
export function LocalSeoSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    local_enabled: 'false',
    local_type: 'LocalBusiness',
    local_name: '',
    local_street: '',
    local_city: '',
    local_region: '',
    local_postal: '',
    local_country: '',
    local_phone: '',
    local_email: '',
    local_price_range: '',
    local_lat: '',
    local_lng: '',
    local_map_url: '',
    local_hours: '',
  });

  useEffect(() => {
    void (async () => {
      try {
        const result = await getSeoSettingsAction();
        if (result.ok && result.data) {
          setSettings((s) => ({ ...s, ...(result.data as Record<string, string>) }));
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const set = (k: string, v: string) => setSettings((s) => ({ ...s, [k]: v }));

  async function save() {
    setSaving(true);
    setMessage(null); setError(null);
    try {
      const result = await saveSeoSettingsAction(settings);
      if (result.ok) { setMessage('Settings saved.'); } else { setError(result.error || 'Save failed'); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
    setSaving(false);
  }

  if (loading) return <p className="v-muted">Loading…</p>;

  const enabled = settings.local_enabled === 'true';
  const inputStyle = { width: '100%' } as const;
  const labelStyle = { display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 } as const;

  const businessTypes = [
    'LocalBusiness', 'Store', 'Restaurant', 'CafeOrCoffeeShop', 'Hotel',
    'MedicalClinic', 'Dentist', 'ProfessionalService', 'RealEstateAgent',
  ];

  return (
    <div>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}

      <div className="v-card">
        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Local Business</h2>
        <p className="v-muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
          For a site that is a shop, clinic, restaurant, agency — anything with an address.
          Adds a <strong>LocalBusiness</strong> schema to every page.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => set('local_enabled', e.target.checked ? 'true' : 'false')}
          />
          <span style={{ fontWeight: 500 }}>This site is a local business</span>
        </label>

        <div style={enabled ? {} : { opacity: 0.5, pointerEvents: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Business type</label>
              <select style={inputStyle} value={settings.local_type || 'LocalBusiness'} onChange={(e) => set('local_type', e.target.value)}>
                {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Business name</label>
              <input style={inputStyle} value={settings.local_name || ''} onChange={(e) => set('local_name', e.target.value)} placeholder="Defaults to site name" />
            </div>
          </div>

          <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)', margin: '16px 0 8px' }}>Address</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Street address</label>
              <input style={inputStyle} value={settings.local_street || ''} onChange={(e) => set('local_street', e.target.value)} />
            </div>
            <div><label style={labelStyle}>City</label><input style={inputStyle} value={settings.local_city || ''} onChange={(e) => set('local_city', e.target.value)} /></div>
            <div><label style={labelStyle}>State / region</label><input style={inputStyle} value={settings.local_region || ''} onChange={(e) => set('local_region', e.target.value)} /></div>
            <div><label style={labelStyle}>Postal code</label><input style={inputStyle} value={settings.local_postal || ''} onChange={(e) => set('local_postal', e.target.value)} /></div>
            <div><label style={labelStyle}>Country</label><input style={inputStyle} value={settings.local_country || ''} onChange={(e) => set('local_country', e.target.value)} placeholder="e.g. PK" /></div>
          </div>

          <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)', margin: '16px 0 8px' }}>Contact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={settings.local_phone || ''} onChange={(e) => set('local_phone', e.target.value)} placeholder="+92 300 1234567" /></div>
            <div><label style={labelStyle}>Email</label><input style={inputStyle} value={settings.local_email || ''} onChange={(e) => set('local_email', e.target.value)} /></div>
            <div><label style={labelStyle}>Price range</label><input style={inputStyle} value={settings.local_price_range || ''} onChange={(e) => set('local_price_range', e.target.value)} placeholder="$$" /></div>
          </div>

          <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)', margin: '16px 0 8px' }}>Map</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div><label style={labelStyle}>Latitude</label><input style={inputStyle} value={settings.local_lat || ''} onChange={(e) => set('local_lat', e.target.value)} placeholder="31.5204" /></div>
            <div><label style={labelStyle}>Longitude</label><input style={inputStyle} value={settings.local_lng || ''} onChange={(e) => set('local_lng', e.target.value)} placeholder="74.3587" /></div>
            <div><label style={labelStyle}>Google Maps link</label><input style={inputStyle} value={settings.local_map_url || ''} onChange={(e) => set('local_map_url', e.target.value)} placeholder="https://maps.app.goo.gl/…" /></div>
          </div>

          <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)', margin: '16px 0 8px' }}>Opening Hours</h3>
          <HoursEditor value={settings.local_hours || ''} onChange={(v) => set('local_hours', v)} />
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="button" className="v-btn v-btn--primary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
