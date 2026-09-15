import type { ThemeManifest } from '../contract';

export const theme05: ThemeManifest = {
  id: 'theme-05',
  name: 'Sand Editorial',
  version: '1.0.0',
  description: 'Warm sand canvas, espresso ink, terracotta accent.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#faf6f1',
    ink: '#3b2f2f',
    accent: '#c2410c',
    muted: '#8a7870',
    card: '#ffffff',
    border: '#e8ddd2',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};

/** @deprecated use theme05 */
export const theme5 = theme05;
