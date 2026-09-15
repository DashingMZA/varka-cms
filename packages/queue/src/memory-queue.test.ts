import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryQueue } from './memory-queue';

describe('memory queue', () => {
  it('processes enqueued job', async () => {
    const q = createMemoryQueue();
    let seen = '';
    q.process('email', async (job) => {
      seen = String((job.payload as { to: string }).to);
    });
    await q.enqueue('email', { to: 'a@b.com' });
    const n = await q.tick();
    assert.equal(n, 1);
    assert.equal(seen, 'a@b.com');
  });
});
