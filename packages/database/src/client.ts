import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/** Loose client type — avoids depending on generated PrismaClient export at typecheck time. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrismaClient = any;

const require = createRequire(import.meta.url);

/** Load monorepo root `.env` when Next runs from apps/admin (cwd ≠ root). */
function ensureEnvLoaded(): void {
  if (process.env.DATABASE_URL) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require('dotenv') as { config: (o?: { path?: string }) => void };
    const here = path.dirname(fileURLToPath(import.meta.url));
    // packages/database/src → repo root
    const candidates = [
      path.resolve(here, '../../../.env'),
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '../../.env'),
    ];
    for (const p of candidates) {
      // turbopackIgnore: runtime .env discovery — not a static asset dependency
      if (existsSync(/*turbopackIgnore: true*/ p)) {
        dotenv.config({ path: p });
        if (process.env.DATABASE_URL) return;
      }
    }
  } catch {
    /* dotenv optional at runtime */
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function createPool(connectionString: string): Pool {
  const needsSsl =
    connectionString.includes('sslmode=') ||
    connectionString.includes('db.prisma.io') ||
    connectionString.includes('neon.tech') ||
    connectionString.includes('supabase');

  return new Pool({
    connectionString,
    connectionTimeoutMillis: 15_000,
    max: 10,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

function createClient(): PrismaClient {
  ensureEnvLoaded();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Put it in the monorepo root `.env` (see `.env.example`), then restart `pnpm dev:admin`.',
    );
  }
  const pool = globalForPrisma.pgPool ?? createPool(connectionString);
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool;
  }
  const adapter = new PrismaPg(pool);
  const { PrismaClient: PrismaClientCtor } = require('@prisma/client') as {
    PrismaClient: new (args?: unknown) => PrismaClient;
  };
  return new PrismaClientCtor({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/** Lazy proxy — avoids throwing at import time when env is missing during build. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
