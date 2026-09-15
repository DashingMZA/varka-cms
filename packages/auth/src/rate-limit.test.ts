import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  createMemoryStore,
  shouldLockout,
  LOCKOUT_THRESHOLD,
} from './rate-limit';

describe('checkRateLimit', () => {
  it('allows under limit', () => {
    const store = createMemoryStore();
    const r = checkRateLimit('k1', { limit: 3, windowSec: 60, store });
    assert.equal(r.allowed, true);
  });

  it('blocks after limit', () => {
    const store = createMemoryStore();
    checkRateLimit('k2', { limit: 2, windowSec: 60, store });
    checkRateLimit('k2', { limit: 2, windowSec: 60, store });
    const r = checkRateLimit('k2', { limit: 2, windowSec: 60, store });
    assert.equal(r.allowed, false);
  });
});

describe('shouldLockout', () => {
  it('locks at threshold', () => {
    assert.equal(shouldLockout(LOCKOUT_THRESHOLD), true);
    assert.equal(shouldLockout(LOCKOUT_THRESHOLD - 1), false);
  });
});
