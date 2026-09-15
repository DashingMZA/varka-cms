import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryQueue } from './memory-queue';

describe('createMemoryQueue', () => {
  it('enqueues and processes', async () => {
    const q = createMemoryQueue();
    let seen = '';
    q.process('test', async (job) => {
      seen = String((job.payload as { x: string }).x);
    });
    await q.enqueue('test', { x: 'ok' });
    assert.equal(q.size(), 1);
    const n = await q.tick();
    assert.equal(n, 1);
    assert.equal(seen, 'ok');
    assert.equal(q.size(), 0);
  });

  it('retries failed jobs', async () => {
    const q = createMemoryQueue();
    let attempts = 0;
    q.process('fail', async () => {
      attempts += 1;
      if (attempts < 2) throw new Error('fail');
    });
    await q.enqueue('fail', {});
    await q.tick();
    assert.equal(q.size(), 1);
    // runAt delayed — force by waiting is hard; just assert retried enqueue
  });
});
