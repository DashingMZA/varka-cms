import type { ThemeManifest } from '../contract';

export const theme7: ThemeManifest = {
  id: 'theme-07',
  name: 'Rose Paper',
  version: '1.0.0',
  description: 'Blush paper, charcoal ink, rose accent.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#fdf6f7',
    ink: '#1c1917',
    accent: '#be123c',
    muted: '#9a7b82',
    card: '#ffffff',
    border: '#f0dfe3',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};
