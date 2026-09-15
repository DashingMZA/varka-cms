import type { ThemeManifest } from '../contract';

export const theme04: ThemeManifest = {
  id: 'theme-04',
  name: 'Ocean Editorial',
  version: '1.0.0',
  description: 'Cool sea-glass field, navy type, teal accent.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#f0f7fa',
    ink: '#0c2340',
    accent: '#0e7490',
    muted: '#64748b',
    card: '#ffffff',
    border: '#cfe3ea',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};

/** @deprecated use theme04 */
export const theme4 = theme04;
