import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listThemes, getTheme, isThemeId, DEFAULT_THEME_ID } from './registry';
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
});
