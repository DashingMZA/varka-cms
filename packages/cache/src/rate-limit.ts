import type { CacheStore, RateLimitResult } from './types';

export type RateLimitOptions = {
  /** Unique key, e.g. ratelimit:comments:ip:1.2.3.4 */
  key: string;
  /** Max hits in window */
  limit: number;
  /** Window length seconds */
  windowSec: number;
  store: CacheStore;
};

/**
 * Fixed-window rate limiter using INCR + TTL on first hit.
 */
export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const n = await opts.store.incr(opts.key, opts.windowSec);
  if (n > opts.limit) {
    return {
      allowed: false,
      remaining: 0,
      limit: opts.limit,
      retryAfterSec: opts.windowSec,
    };
  }
  return {
    allowed: true,
    remaining: Math.max(0, opts.limit - n),
    limit: opts.limit,
  };
}

export function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || 'unknown';
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
