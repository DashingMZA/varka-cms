import type { ThemeManifest } from '../contract';

export const theme8: ThemeManifest = {
  id: 'theme-08',
  name: 'Slate Magazine',
  version: '1.0.0',
  description: 'Cool slate gray magazine feel, indigo accent.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#f4f4f5',
    ink: '#18181b',
    accent: '#4338ca',
    muted: '#71717a',
    card: '#ffffff',
    border: '#e4e4e7',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};
