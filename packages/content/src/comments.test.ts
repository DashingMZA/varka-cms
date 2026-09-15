import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { submitCommentInput } from './comments';

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
});
