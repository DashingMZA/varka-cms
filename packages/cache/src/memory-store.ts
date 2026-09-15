import type { CacheStore } from './types';

type Entry = { value: string; expiresAt?: number };

/**
 * Process-local cache. Used when REDIS_URL is unset.
 * Not shared across instances — production should use Redis.
 */
export function createMemoryStore(): CacheStore {
  const map = new Map<string, Entry>();

  function purge(key: string): void {
    const e = map.get(key);
    if (e?.expiresAt && e.expiresAt <= Date.now()) map.delete(key);
  }

  return {
    async get(key) {
      purge(key);
      return map.get(key)?.value ?? null;
    },
    async set(key, value, ttlSec) {
      const expiresAt = ttlSec ? Date.now() + ttlSec * 1000 : undefined;
      map.set(key, { value, expiresAt });
    },
    async del(key) {
      map.delete(key);
    },
    async incr(key, ttlSec) {
      purge(key);
      const cur = map.get(key);
      const next = String((cur ? Number(cur.value) || 0 : 0) + 1);
      const expiresAt =
        cur?.expiresAt ?? (ttlSec ? Date.now() + ttlSec * 1000 : undefined);
      map.set(key, { value: next, expiresAt });
      return Number(next);
    },
    async ping() {
      return true;
    },
  };
}
