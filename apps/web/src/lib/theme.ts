import { DEFAULT_THEME_ID, getTheme, getThemeCss, isThemeId } from '@varka/themes';

/** Active theme id — PUBLIC_THEME_ID or default Clean Editorial */
export function activeThemeId(): string {
  const id = process.env.PUBLIC_THEME_ID || DEFAULT_THEME_ID;
  return isThemeId(id) ? id : DEFAULT_THEME_ID;
}

/** Sync manifest (CSS may be empty until getThemeCss). */
export function activeTheme() {
  return getTheme(activeThemeId());
}

/** Full module with CSS string for Astro layouts. */
export async function activeThemeWithCss() {
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
