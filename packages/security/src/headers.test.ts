import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { securityHeaders } from './headers';

describe('securityHeaders', () => {
  it('includes nosniff and CSP', () => {
    const h = securityHeaders();
    assert.equal(h['X-Content-Type-Options'], 'nosniff');
    assert.match(h['Content-Security-Policy'] ?? '', /default-src/);
  });
});
