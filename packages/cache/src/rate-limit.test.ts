import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from './memory-store';
import { rateLimit } from './rate-limit';

describe('rateLimit', () => {
  it('allows under limit then blocks', async () => {
    const store = createMemoryStore();
    const key = 'test:rl:1';
    const a = await rateLimit({ key, limit: 2, windowSec: 60, store });
    const b = await rateLimit({ key, limit: 2, windowSec: 60, store });
    const c = await rateLimit({ key, limit: 2, windowSec: 60, store });
    assert.equal(a.allowed, true);
    assert.equal(b.allowed, true);
    assert.equal(c.allowed, false);
  });
});
