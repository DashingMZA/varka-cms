import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { postPath, homePath, parsePathname } from './routes';
import type { LanguageRecord } from './types';

const en: LanguageRecord = {
  id: '1',
  locale: 'en',
  languageCode: 'en',
  script: 'Latn',
  direction: 'ltr',
  urlPrefix: '',
  defaultLanguage: true,
  enabled: true,
};

const pa: LanguageRecord = {
  id: '2',
  locale: 'pa',
  languageCode: 'pa',
  script: 'Guru',
  direction: 'ltr',
  urlPrefix: 'pa',
  defaultLanguage: false,
  enabled: true,
};

describe('postPath', () => {
  it('default language uses /post/slug', () => {
    assert.equal(postPath(en, 'hello'), '/post/hello');
  });
  it('punjabi uses /pa/post/slug', () => {
    assert.equal(postPath(pa, 'hello'), '/pa/post/hello');
  });
});

describe('parsePathname', () => {
  it('parses prefixed path', () => {
    const r = parsePathname('/pa/post/hello', [en, pa]);
    assert.equal(r.locale, 'pa');
    assert.equal(r.rest, '/post/hello');
  });
  it('default has no prefix', () => {
    const r = parsePathname('/post/hello', [en, pa]);
    assert.equal(r.locale, 'en');
    assert.equal(r.prefix, '');
  });
});

describe('homePath', () => {
  it('en is /', () => assert.equal(homePath(en), '/'));
  it('pa is /pa', () => assert.equal(homePath(pa), '/pa'));
});
