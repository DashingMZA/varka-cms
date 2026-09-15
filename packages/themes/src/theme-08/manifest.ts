import type { ThemeManifest } from '../contract';

export const theme08: ThemeManifest = {
  id: 'theme-08',
  name: 'Slate Editorial',
  version: '1.0.0',
  description: 'Cool slate paper, graphite ink, indigo accent.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#f1f5f9',
    ink: '#0f172a',
    accent: '#4338ca',
    muted: '#64748b',
    card: '#ffffff',
    border: '#e2e8f0',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};
