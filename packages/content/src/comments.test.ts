import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { looksLikeSpam, submitCommentInput } from './comments';

describe('submitCommentInput', () => {
  it('requires body and author', () => {
    assert.throws(() =>
      submitCommentInput.parse({ siteId: 's', postId: 'p', authorName: '', body: '' }),
    );
    const ok = submitCommentInput.parse({
      siteId: 's',
      postId: 'p',
      authorName: 'Ada',
      body: 'Nice post',
    });
    assert.equal(ok.authorName, 'Ada');
  });

  it('allows empty email string', () => {
    const ok = submitCommentInput.parse({
      siteId: 's',
      postId: 'p',
      authorName: 'Ada',
      authorEmail: '',
      body: 'Hi',
    });
    assert.equal(ok.authorEmail, '');
  });
});

describe('looksLikeSpam', () => {
  it('flags many links', () => {
    assert.equal(
      looksLikeSpam('http://a.com http://b.com http://c.com', 'x'),
      true,
    );
  });

  it('allows clean text', () => {
    assert.equal(looksLikeSpam('Great article, thanks!', 'Reader'), false);
  });

  it('flags viagra', () => {
    assert.equal(looksLikeSpam('buy viagra now', 'bot'), true);
  });
});
