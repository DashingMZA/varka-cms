import type { ThemeManifest } from '../contract';

/** Clean Editorial — paper / ink */
export const theme01: ThemeManifest = {
  id: 'theme-01',
  name: 'Clean Editorial',
  version: '1.0.0',
  description: 'Light paper background, serif headlines, blue accent.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#f7f4ef',
    ink: '#1c1917',
    accent: '#1d4ed8',
    muted: '#78716c',
    card: '#ffffff',
    border: '#e7e5e4',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};

/** @deprecated use theme01 */
export const theme1 = theme01;
