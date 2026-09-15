import type { CacheStore } from './types';

/**
 * Minimal Redis store via fetch to Redis REST is NOT assumed.
 * This uses dynamic import of `redis` (node-redis) when installed.
 *
 * Install: pnpm add redis
 * Env: REDIS_URL=redis://...
 */
export async function createRedisStore(url: string): Promise<CacheStore> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let redisMod: any;
  try {
    redisMod = await import(/* webpackIgnore: true */ 'redis');
  } catch {
    throw new Error('Package "redis" not installed — use memory store or pnpm add redis');
  }

  const client = redisMod.createClient({ url });
  client.on('error', (err: Error) => {
    console.error('[varka/cache] redis error', err.message);
  });
  await client.connect();

  return {
    async get(key) {
      return client.get(key);
    },
    async set(key, value, ttlSec) {
      if (ttlSec && ttlSec > 0) {
        await client.set(key, value, { EX: ttlSec });
      } else {
        await client.set(key, value);
      }
    },
    async del(key) {
      await client.del(key);
    },
    async incr(key, ttlSec) {
      const n = await client.incr(key);
      if (n === 1 && ttlSec && ttlSec > 0) {
        await client.expire(key, ttlSec);
      }
      return n;
    },
    async ping() {
      const p = await client.ping();
      return p === 'PONG';
    },
  };
}
