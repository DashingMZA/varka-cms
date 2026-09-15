import type { CacheStore } from './types';
import { createMemoryStore } from './memory-store';
import { createRedisStore } from './redis-store';

let singleton: CacheStore | null = null;
let driver: 'memory' | 'redis' = 'memory';

export function getCacheDriver(): 'memory' | 'redis' {
  return driver;
}

/**
 * Lazy singleton. Prefers REDIS_URL when set; falls back to memory.
 */
export async function getCache(): Promise<CacheStore> {
  if (singleton) return singleton;
  const url = process.env.REDIS_URL?.trim();
  if (url) {
    try {
      singleton = await createRedisStore(url);
      driver = 'redis';
      return singleton;
    } catch (e) {
      console.warn(
        '[varka/cache] Redis unavailable, falling back to memory:',
        e instanceof Error ? e.message : e,
      );
    }
  }
  singleton = createMemoryStore();
  driver = 'memory';
  return singleton;
}

/** Test helper — inject store */
export function setCacheForTests(store: CacheStore | null): void {
  singleton = store;
  driver = store ? 'memory' : 'memory';
}
