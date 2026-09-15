import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, assertSlugAllowed, RESERVED_PATHS } from './slug';

describe('slugify', () => {
  it('kebab cases titles', () => {
    assert.equal(slugify('Hello World!'), 'hello-world');
  });
});

describe('assertSlugAllowed', () => {
  it('rejects reserved', () => {
    assert.throws(() => assertSlugAllowed('admin'));
    assert.ok(RESERVED_PATHS.has('post'));
  });
  it('accepts valid', () => {
    assert.doesNotThrow(() => assertSlugAllowed('my-post'));
  });
});
