import type { ThemeManifest } from '../contract';

export const theme11: ThemeManifest = {
  id: 'theme-11',
  name: 'Celebrtiy Kadence',
  version: '1.0.0',
  description:
    'Kadence-style celebrity biography theme: sticky header, lavender hero bands, featured grid, tabbed carousels, and pink-accent article pages.',
  supports: { rtl: false, darkMode: false },
  tokens: {
    bg: '#efeff5',
    ink: '#040037',
    accent: '#E21E51',
    muted: '#666699',
    card: '#f8f9fa',
    border: '#deddeb',
    fontSerif: "'Overpass', 'Segoe UI', system-ui, sans-serif",
    fontSans: "'Overpass', 'Segoe UI', system-ui, sans-serif",
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};
