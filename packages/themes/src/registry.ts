import type { ThemeManifest, ThemeModule } from './contract';
import { theme01 } from './theme-01/manifest';
import { theme02 } from './theme-02/manifest';
import { theme03 } from './theme-03/manifest';
import { theme04 } from './theme-04/manifest';
import { theme05 } from './theme-05/manifest';
import { theme06 } from './theme-06/manifest';
import { theme07 } from './theme-07/manifest';
import { theme08 } from './theme-08/manifest';
import { theme09 } from './theme-09/manifest';
import { theme10 } from './theme-10/manifest';

/**
 * Registry uses only manifest modules (stable exports).
 * CSS strings are loaded lazily via getThemeCss() to avoid Turbopack
 * named-export mismatches on styles.css.ts during admin builds.
 */
const MANIFESTS: Record<string, ThemeManifest> = {
  'theme-01': theme01,
  'theme-02': theme02,
  'theme-03': theme03,
  'theme-04': theme04,
  'theme-05': theme05,
  'theme-06': theme06,
  'theme-07': theme07,
  'theme-08': theme08,
  'theme-09': theme09,
  'theme-10': theme10,
};

export const DEFAULT_THEME_ID = 'theme-01';

export const THEME_REGISTRY: Record<string, ThemeModule> = Object.fromEntries(
  Object.entries(MANIFESTS).map(([id, manifest]) => [id, { manifest, css: '' }]),
);

export function listThemes(): ThemeModule[] {
  return Object.values(THEME_REGISTRY);
}

export function getTheme(id: string): ThemeModule {
  const fallback = THEME_REGISTRY[DEFAULT_THEME_ID];
  if (!fallback) {
    throw new Error('THEME_REGISTRY is empty — theme-01 missing');
  }
  return THEME_REGISTRY[id] ?? fallback;
}

export function isThemeId(id: string): boolean {
  return id in THEME_REGISTRY;
}

/** Lazy CSS — path without .ts extension (TS5097 / allowImportingTsExtensions). */
export async function getThemeCss(id: string): Promise<string> {
  const key = isThemeId(id) ? id : DEFAULT_THEME_ID;
  switch (key) {
    case 'theme-01':
      return (await import('./theme-01/styles.css')).theme01Css;
    case 'theme-02':
      return (await import('./theme-02/styles.css')).theme02Css;
    case 'theme-03':
      return (await import('./theme-03/styles.css')).theme03Css;
    case 'theme-04':
      return (await import('./theme-04/styles.css')).theme04Css;
    case 'theme-05':
      return (await import('./theme-05/styles.css')).theme05Css;
    case 'theme-06':
      return (await import('./theme-06/styles.css')).theme06Css;
    case 'theme-07':
      return (await import('./theme-07/styles.css')).theme07Css;
    case 'theme-08':
      return (await import('./theme-08/styles.css')).theme08Css;
    case 'theme-09':
      return (await import('./theme-09/styles.css')).theme09Css;
    case 'theme-10':
      return (await import('./theme-10/styles.css')).theme10Css;
    default:
      return (await import('./theme-01/styles.css')).theme01Css;
  }
}
