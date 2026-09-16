import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectImageMagic, assertSafeImagePayload } from './image-security';

describe('image security', () => {
  it('detects PNG', () => {
    const buf = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    assert.equal(detectImageMagic(buf)?.kind, 'png');
  });

  it('rejects random bytes', () => {
    assert.throws(() => assertSafeImagePayload(Buffer.from('not-an-image')));
  });
});
