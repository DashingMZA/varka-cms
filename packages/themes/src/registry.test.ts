import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listThemes,
  getTheme,
  isThemeId,
  getThemeCss,
  DEFAULT_THEME_ID,
} from './registry';
import { themeManifestSchema } from './contract';

describe('theme registry', () => {
  it('has ten themes', () => {
    assert.equal(listThemes().length, 10);
  });

  it('manifests validate', () => {
    for (const t of listThemes()) {
      assert.doesNotThrow(() => themeManifestSchema.parse(t.manifest));
    }
  });

  it('default resolves', () => {
    assert.equal(getTheme('missing').manifest.id, DEFAULT_THEME_ID);
    assert.equal(isThemeId('theme-01'), true);
    assert.equal(isThemeId('theme-10'), true);
    assert.equal(isThemeId('theme-99'), false);
  });

  it('unique ids theme-01..theme-10', () => {
    const ids = listThemes().map((t) => t.manifest.id).sort();
    assert.deepEqual(
      ids,
      Array.from({ length: 10 }, (_, i) => `theme-${String(i + 1).padStart(2, '0')}`),
    );
  });

  it('getThemeCss returns non-empty CSS for every theme', async () => {
    for (const t of listThemes()) {
      const css = await getThemeCss(t.manifest.id);
      assert.ok(css.length > 50, `${t.manifest.id} css too short`);
      assert.match(css, /--varka-bg/);
      assert.match(css, /--varka-accent/);
    }
  });
});
