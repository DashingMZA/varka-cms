import type { ThemeManifest } from '../contract';

export const theme07: ThemeManifest = {
  id: 'theme-07',
  name: 'Rose Editorial',
  version: '1.0.0',
  description: 'Soft blush paper, charcoal ink, rose accent.',
  supports: { rtl: true, darkMode: false },
  tokens: {
    bg: '#fdf2f4',
    ink: '#1c1917',
    accent: '#be123c',
    muted: '#9f7a85',
    card: '#ffffff',
    border: '#f0d5dc',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};

/** @deprecated use theme07 */
export const theme7 = theme07;
