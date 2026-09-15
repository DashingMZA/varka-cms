const SECRET_KEY_PATTERN =
  /(secret|password|passwd|token|api[_-]?key|access[_-]?key|private[_-]?key|authorization|database_url|redis_url|connectionstring)/i;

const SECRET_VALUE_PATTERN =
  /\b(postgres(?:ql)?:\/\/[^\s]+|redis:\/\/[^\s]+|sk-[a-zA-Z0-9]{10,}|ghp_[a-zA-Z0-9]{20,})\b/gi;

/**
 * Redact secrets from structured log payloads.
 * Never log AUTH_SECRET, S3 keys, or DATABASE_URL.
 */
export function redactSecrets<T>(input: T): T {
  return redactValue(input) as T;
}

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value.replace(SECRET_VALUE_PATTERN, '[REDACTED]');
  }
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY_PATTERN.test(key)) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redactValue(val);
      }
    }
    return out;
  }
  return value;
}

export function redactString(message: string): string {
  return message.replace(SECRET_VALUE_PATTERN, '[REDACTED]');
}
