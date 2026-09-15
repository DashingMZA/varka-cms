import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requirePermission, hasPermission, ForbiddenError, UnauthorizedError } from './require';

const author = {
  userId: 'u1',
  roles: ['author'],
  permissions: ['posts.read', 'posts.create', 'posts.update'],
};

describe('requirePermission', () => {
  it('allows when permission present', () => {
    assert.doesNotThrow(() => requirePermission(author, 'posts.create'));
  });

  it('forbids author publish', () => {
    assert.throws(() => requirePermission(author, 'posts.publish'), ForbiddenError);
  });

  it('unauthorized when no context', () => {
    assert.throws(() => requirePermission(null, 'posts.read'), UnauthorizedError);
  });

  it('hasPermission helper', () => {
    assert.equal(hasPermission(author, 'posts.create'), true);
    assert.equal(hasPermission(author, 'posts.delete'), false);
  });
});
