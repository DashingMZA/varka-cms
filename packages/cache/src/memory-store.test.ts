import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from './memory-store';

describe('memory store', () => {
  it('get/set/del', async () => {
    const s = createMemoryStore();
    await s.set('a', '1');
    assert.equal(await s.get('a'), '1');
    await s.del('a');
    assert.equal(await s.get('a'), null);
  });
  it('incr', async () => {
    const s = createMemoryStore();
    assert.equal(await s.incr('n', 60), 1);
    assert.equal(await s.incr('n', 60), 2);
  });
});
