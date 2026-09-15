import type { ThemeModule } from './contract';
import { theme1 } from './theme-01/manifest';
import { theme1Css } from './theme-01/styles.css';
import { theme2 } from './theme-02/manifest';
import { theme2Css } from './theme-02/styles.css';
import { theme3 } from './theme-03/manifest';
import { theme3Css } from './theme-03/styles.css';
import { theme4 } from './theme-04/manifest';
import { theme4Css } from './theme-04/styles.css';
import { theme5 } from './theme-05/manifest';
import { theme5Css } from './theme-05/styles.css';
import { theme6 } from './theme-06/manifest';
import { theme6Css } from './theme-06/styles.css';
import { theme7 } from './theme-07/manifest';
import { theme7Css } from './theme-07/styles.css';
import { theme8 } from './theme-08/manifest';
import { theme8Css } from './theme-08/styles.css';
import { theme9 } from './theme-09/manifest';
import { theme9Css } from './theme-09/styles.css';
import { theme10 } from './theme-10/manifest';
import { theme10Css } from './theme-10/styles.css';

export const THEME_REGISTRY: Record<string, ThemeModule> = {
  'theme-01': { manifest: theme1, css: theme1Css },
  'theme-02': { manifest: theme2, css: theme2Css },
  'theme-03': { manifest: theme3, css: theme3Css },
  'theme-04': { manifest: theme4, css: theme4Css },
  'theme-05': { manifest: theme5, css: theme5Css },
  'theme-06': { manifest: theme6, css: theme6Css },
  'theme-07': { manifest: theme7, css: theme7Css },
  'theme-08': { manifest: theme8, css: theme8Css },
  'theme-09': { manifest: theme9, css: theme9Css },
  'theme-10': { manifest: theme10, css: theme10Css },
};

export const DEFAULT_THEME_ID = 'theme-01';

export function listThemes(): ThemeModule[] {
  return Object.values(THEME_REGISTRY);
}

export function getTheme(id: string): ThemeModule {
  const t = THEME_REGISTRY[id];
  if (!t) {
    return THEME_REGISTRY[DEFAULT_THEME_ID]!;
  }
  return t;
}

export function isThemeId(id: string): boolean {
  return id in THEME_REGISTRY;
}
