import type { ThemeManifest } from '../contract';

export const theme03: ThemeManifest = {
  id: 'theme-03',
  name: 'Forest Editorial',
  version: '1.0.0',
  description: 'Soft sage background, deep forest ink, green accent.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#f3f6f1',
    ink: '#14231a',
    accent: '#2f6f4e',
    muted: '#6b7c72',
    card: '#ffffff',
    border: '#d7e0d9',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};

/** @deprecated use theme03 */
export const theme3 = theme03;
