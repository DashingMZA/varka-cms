import type { ThemeManifest } from '../contract';

export const theme10: ThemeManifest = {
  id: 'theme-10',
  name: 'Aurora Dark',
  version: '1.0.0',
  description: 'Deep purple-black dark theme, violet accent.',
  supports: { rtl: true, darkMode: true },
  tokens: {
    bg: '#0f0a1a',
    ink: '#f5f3ff',
    accent: '#a78bfa',
    muted: '#a5a1b8',
    card: '#1a1229',
    border: '#2e2640',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};
