export type CacheStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec?: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Atomic increment; creates key with TTL if missing */
  incr(key: string, ttlSec?: number): Promise<number>;
  /** Optional ping for health */
  ping?(): Promise<boolean>;
};

export type RateLimitResult =
  | { allowed: true; remaining: number; limit: number }
  | { allowed: false; remaining: 0; limit: number; retryAfterSec: number };
