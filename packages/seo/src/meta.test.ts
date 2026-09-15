import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSeo } from './meta';

describe('buildSeo', () => {
  it('builds canonical and title', () => {
    const seo = buildSeo({
      siteName: 'VARKA',
      siteUrl: 'https://example.com',
      title: 'Hello',
      description: 'Desc',
      path: '/post/hello',
      type: 'article',
    });
    assert.equal(seo.canonical, 'https://example.com/post/hello');
    assert.equal(seo.title, 'Hello · VARKA');
    assert.equal(seo.openGraph['og:type'], 'article');
    assert.equal(seo.jsonLd['@type'], 'Article');
  });
});
