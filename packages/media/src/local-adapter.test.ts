import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createLocalAdapter } from './local-adapter';

describe('local adapter', () => {
  it('writes and reads back via path', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'varka-media-'));
    try {
      const adapter = createLocalAdapter({ rootDir: dir, publicBaseUrl: '/media' });
      const body = Buffer.from('hello-varka');
      const put = await adapter.put({ key: '2026/test.txt', body, contentType: 'text/plain' });
      assert.equal(put.sizeBytes, body.length);
      const disk = await readFile(path.join(dir, '2026/test.txt'), 'utf8');
      assert.equal(disk, 'hello-varka');
      assert.equal(adapter.getUrl('2026/test.txt'), '/media/2026/test.txt');
      await adapter.delete('2026/test.txt');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
