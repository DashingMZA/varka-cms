/**
 * In-memory rate limit + lockout for login attempts.
 * Phase 9 can swap Redis adapter behind the same interface.
 */

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSec: number };

export type RateLimitStore = {
  get(key: string): { count: number; resetAt: number } | undefined;
  set(key: string, value: { count: number; resetAt: number }): void;
  delete(key: string): void;
};

export function createMemoryStore(): RateLimitStore {
  const map = new Map<string, { count: number; resetAt: number }>();
  return {
    get: (k) => map.get(k),
    set: (k, v) => {
      map.set(k, v);
    },
    delete: (k) => {
      map.delete(k);
    },
  };
}

const defaultStore = createMemoryStore();

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowSec: number; store?: RateLimitStore } = {
    limit: 10,
    windowSec: 60,
  },
): RateLimitResult {
  const store = opts.store ?? defaultStore;
  const now = Date.now();
  const cur = store.get(key);
  if (!cur || cur.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + opts.windowSec * 1000 });
    return { allowed: true, remaining: opts.limit - 1 };
  }
  if (cur.count >= opts.limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
    };
  }
  store.set(key, { count: cur.count + 1, resetAt: cur.resetAt });
  return { allowed: true, remaining: opts.limit - cur.count - 1 };
}

/** 5 failures → 15 minute lockout */
export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_MINUTES = 15;

export function shouldLockout(failedLogins: number): boolean {
  return failedLogins >= LOCKOUT_THRESHOLD;
}

export function lockoutUntil(from = new Date()): Date {
  return new Date(from.getTime() + LOCKOUT_MINUTES * 60 * 1000);
}
