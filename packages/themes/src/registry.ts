import type { ThemeModule } from './contract';
import { theme01 } from './theme-01/manifest';
import { theme01Css } from './theme-01/styles.css';
import { theme02 } from './theme-02/manifest';
import { theme02Css } from './theme-02/styles.css';
import { theme03 } from './theme-03/manifest';
import { theme03Css } from './theme-03/styles.css';
import { theme04 } from './theme-04/manifest';
import { theme04Css } from './theme-04/styles.css';
import { theme05 } from './theme-05/manifest';
import { theme05Css } from './theme-05/styles.css';
import { theme06 } from './theme-06/manifest';
import { theme06Css } from './theme-06/styles.css';
import { theme07 } from './theme-07/manifest';
import { theme07Css } from './theme-07/styles.css';
import { theme08 } from './theme-08/manifest';
import { theme08Css } from './theme-08/styles.css';
import { theme09 } from './theme-09/manifest';
import { theme09Css } from './theme-09/styles.css';
import { theme10 } from './theme-10/manifest';
import { theme10Css } from './theme-10/styles.css';

export const THEME_REGISTRY: Record<string, ThemeModule> = {
  'theme-01': { manifest: theme01, css: theme01Css },
  'theme-02': { manifest: theme02, css: theme02Css },
  'theme-03': { manifest: theme03, css: theme03Css },
  'theme-04': { manifest: theme04, css: theme04Css },
  'theme-05': { manifest: theme05, css: theme05Css },
  'theme-06': { manifest: theme06, css: theme06Css },
  'theme-07': { manifest: theme07, css: theme07Css },
  'theme-08': { manifest: theme08, css: theme08Css },
  'theme-09': { manifest: theme09, css: theme09Css },
  'theme-10': { manifest: theme10, css: theme10Css },
};

export const DEFAULT_THEME_ID = 'theme-01';

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
