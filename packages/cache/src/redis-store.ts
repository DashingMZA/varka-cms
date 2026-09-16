import type { CacheStore } from './types';

/** Minimal shape used from node-redis (optional dependency). */
type RedisClient = {
  on(event: string, cb: (err: Error) => void): void;
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { EX?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, sec: number): Promise<unknown>;
  ping(): Promise<string>;
};

type RedisModule = {
  createClient: (opts: { url: string }) => RedisClient;
};

/**
 * Redis store via optional `redis` package.
 * Install: pnpm add redis — Env: REDIS_URL=redis://...
 * Without redis, getCache() falls back to memory.
 */
export async function createRedisStore(url: string): Promise<CacheStore> {
  let redisMod: RedisModule;
  try {
    // Optional package — ambient types in redis-ambient.d.ts
    redisMod = (await import('redis')) as unknown as RedisModule;
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
