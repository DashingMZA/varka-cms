import type { ThemeManifest } from '../contract';

export const theme06: ThemeManifest = {
  id: 'theme-06',
  name: 'Midnight Mono',
  version: '1.0.0',
  description: 'Near-black mono layout, white type, electric blue accent.',
  supports: { rtl: true, darkMode: true },
  tokens: {
    bg: '#09090b',
    ink: '#fafafa',
    accent: '#3b82f6',
    muted: '#a1a1aa',
    card: '#18181b',
    border: '#27272a',
    fontSerif: 'Georgia, "Times New Roman", serif',
    fontSans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  templates: ['home', 'post', 'page', 'category', 'tag', 'author', 'search', '404'],
};

/** @deprecated use theme06 */
export const theme6 = theme06;
