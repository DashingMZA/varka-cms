import { theme05 } from './manifest';

const t = theme05.tokens;

export const theme05Css = `
:root {
  --varka-bg: ${t.bg};
  --varka-ink: ${t.ink};
  --varka-accent: ${t.accent};
  --varka-muted: ${t.muted};
  --varka-card: ${t.card};
  --varka-border: ${t.border};
  --varka-font-serif: ${t.fontSerif};
  --varka-font-sans: ${t.fontSans};
}
body {
  margin: 0;
  background: var(--varka-bg);
  color: var(--varka-ink);
  font-family: var(--varka-font-sans);
  line-height: 1.65;
}
.site-header {
  border-bottom: 1px solid var(--varka-border);
  background: var(--varka-card);
}
.site-header a { color: var(--varka-ink); text-decoration: none; }
.site-title {
  font-family: var(--varka-font-serif);
  font-size: 1.5rem;
  font-weight: 700;
}
.post-title {
  font-family: var(--varka-font-serif);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  line-height: 1.2;
  margin: 0 0 0.5rem;
}
.post-meta { color: var(--varka-muted); font-size: 0.9rem; }
.prose a { color: var(--varka-accent); }
.prose img { max-width: 100%; height: auto; }
.container { width: min(720px, 92vw); margin: 0 auto; padding: 1.5rem 0 3rem; }
`.trim();
