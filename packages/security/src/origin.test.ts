import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertSameOrigin, OriginError } from './origin';

describe('assertSameOrigin', () => {
  it('allows GET', () => {
    const req = new Request('http://localhost/api', { method: 'GET' });
    assert.doesNotThrow(() => assertSameOrigin(req, ['http://localhost:3000']));
  });
  it('blocks bad origin on POST', () => {
    const req = new Request('http://localhost/api', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    });
    assert.throws(() => assertSameOrigin(req, ['http://localhost:3000']), OriginError);
  });
  it('allows matching origin', () => {
    const req = new Request('http://localhost/api', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
    });
    assert.doesNotThrow(() => assertSameOrigin(req, ['http://localhost:3000']));
  });
});
