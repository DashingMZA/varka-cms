import type { ThemeManifest } from '../contract';

/** Dark Editorial */
export const theme02: ThemeManifest = {
  id: 'theme-02',
  name: 'Dark Editorial',
  version: '1.0.0',
  description: 'Dark ink background, soft paper text, amber accent.',
  supports: { rtl: true, darkMode: true },
  tokens: {
    bg: '#0c0a09',
    ink: '#f5f5f4',
    accent: '#f59e0b',
    muted: '#a8a29e',
    card: '#1c1917',
    border: '#292524',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};
