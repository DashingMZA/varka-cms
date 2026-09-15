import { DEFAULT_THEME_ID, getTheme, getThemeCss, isThemeId } from '@varka/themes';

const API = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

/** Prefer admin SiteSetting active theme; fall back to PUBLIC_THEME_ID / default. */
export async function resolveActiveThemeId(): Promise<string> {
  try {
    const res = await fetch(`${API}/api/public/theme`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as { id?: string };
      if (data.id && isThemeId(data.id)) return data.id;
    }
  } catch {
    /* offline */
  }
  const id = import.meta.env.PUBLIC_THEME_ID || DEFAULT_THEME_ID;
  return isThemeId(id) ? id : DEFAULT_THEME_ID;
}

export function activeThemeId(): string {
  const id = import.meta.env.PUBLIC_THEME_ID || DEFAULT_THEME_ID;
  return isThemeId(id) ? id : DEFAULT_THEME_ID;
}

export function activeTheme() {
  return getTheme(activeThemeId());
}

/** Full module with CSS — prefers public API payload when available. */
export async function activeThemeWithCss() {
  try {
    const res = await fetch(`${API}/api/public/theme`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        id: string;
        manifest: { name?: string; id?: string };
        css: string;
      };
      if (data.css) {
        return {
          id: data.id,
          manifest: data.manifest ?? getTheme(data.id).manifest,
          css: data.css,
        };
      }
    }
  } catch {
    /* offline */
  }

  const id = activeThemeId();
  const theme = getTheme(id);
  let css = '';
  try {
    css = await getThemeCss(id);
  } catch {
    css = '';
  }
  return {
    id,
    manifest: theme.manifest,
    css: css || theme.css || '',
  };
}
