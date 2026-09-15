import { DEFAULT_THEME_ID, getTheme } from '@varka/themes';

/** Active theme id — later from SiteSetting via build-time fetch / CMS API */
export function activeThemeId(): string {
  return process.env.PUBLIC_THEME_ID || DEFAULT_THEME_ID;
}

export function activeTheme() {
  return getTheme(activeThemeId());
}
