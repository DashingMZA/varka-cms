import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSitemapXml, buildRobotsTxt } from './sitemap';

describe('sitemap/robots', () => {
  it('xml contains loc', () => {
    const xml = buildSitemapXml([{ loc: 'https://example.com/post/a' }]);
    assert.match(xml, /https:\/\/example.com\/post\/a/);
    assert.match(xml, /urlset/);
  });
  it('robots has sitemap line', () => {
    const txt = buildRobotsTxt({ siteUrl: 'https://example.com' });
    assert.match(txt, /Sitemap: https:\/\/example.com\/sitemap.xml/);
  });
});
