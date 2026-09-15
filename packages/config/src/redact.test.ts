import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactSecrets, redactString } from './redact';

describe('redactSecrets', () => {
  it('redacts known secret keys', () => {
    const result = redactSecrets({
      AUTH_SECRET: 'super-secret-value-32chars-minimum',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/varka',
      safe: 'ok',
    });
    assert.equal(result.AUTH_SECRET, '[REDACTED]');
    assert.equal(result.DATABASE_URL, '[REDACTED]');
    assert.equal(result.safe, 'ok');
  });

  it('redacts secret-looking strings', () => {
    const msg = redactString('connect postgresql://u:p@host/db please');
    assert.match(msg, /\[REDACTED\]/);
    assert.doesNotMatch(msg, /postgresql:\/\//);
  });
});
