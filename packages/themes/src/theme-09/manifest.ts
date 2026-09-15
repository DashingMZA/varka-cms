import type { ThemeManifest } from '../contract';

export const theme9: ThemeManifest = {
  id: 'theme-09',
  name: 'High Contrast',
  version: '1.0.0',
  description: 'Pure white / pure black, hard accessibility-first contrast.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#ffffff',
    ink: '#000000',
    accent: '#0000ee',
    muted: '#444444',
    card: '#ffffff',
    border: '#000000',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};
