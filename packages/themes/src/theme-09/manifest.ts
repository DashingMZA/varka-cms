import type { ThemeManifest } from '../contract';

export const theme09: ThemeManifest = {
  id: 'theme-09',
  name: 'Amber Editorial',
  version: '1.0.0',
  description: 'Cream paper, deep brown ink, amber accent.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#fffbeb',
    ink: '#292524',
    accent: '#d97706',
    muted: '#a8a29e',
    card: '#ffffff',
    border: '#fde68a',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};
