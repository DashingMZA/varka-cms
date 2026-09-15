import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml, htmlToMarkdown } from './index';

describe('markdownToHtml', () => {
  it('renders heading and paragraph', () => {
    const html = markdownToHtml('# Title\n\nHello **world**');
    assert.match(html, /<h1>Title<\/h1>/);
    assert.match(html, /<strong>world<\/strong>/);
  });

  it('renders list', () => {
    const html = markdownToHtml('- a\n- b');
    assert.match(html, /<ul>/);
    assert.match(html, /<li>a<\/li>/);
  });
});

describe('htmlToMarkdown', () => {
  it('round-trips simple bold', () => {
    const md = htmlToMarkdown('<p>Hi <strong>there</strong></p>');
    assert.match(md, /\*\*there\*\*/);
  });
});
