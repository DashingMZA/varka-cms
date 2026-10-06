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
  const client = new PrismaClientCtor({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Better Auth passes user IDs as strings; User.id is Int. Convert string
  // IDs to numbers for User-related models to avoid Prisma type errors.
  const INT_ID_FIELDS: Record<string, string[]> = {
    User: ['id'],
    Session: ['userId'],
    Account: ['userId'],
    TwoFactor: ['userId'],
    UserRole: ['userId'],
    AuthorProfile: ['userId'],
    Post: ['authorId'],
    Page: ['authorId'],
    Revision: ['authorId'],
    Comment: ['authorUserId'],
    MediaAsset: ['uploadedById'],
  };

  function convertIds(obj: unknown, fields: string[]): void {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (const item of obj) convertIds(item, fields);
      return;
    }
    const rec = obj as Record<string, unknown>;
    for (const key of Object.keys(rec)) {
      const val = rec[key];
      if (fields.includes(key)) {
        if (typeof val === 'string' && /^\d+$/.test(val)) {
          rec[key] = parseInt(val, 10);
        } else if (val && typeof val === 'object') {
          const cond = val as Record<string, unknown>;
          for (const op of ['equals', 'not', 'lt', 'lte', 'gt', 'gte']) {
            if (typeof cond[op] === 'string' && /^\d+$/.test(cond[op] as string)) {
              cond[op] = parseInt(cond[op] as string, 10);
            }
          }
          for (const op of ['in', 'notIn']) {
            if (Array.isArray(cond[op])) {
              cond[op] = (cond[op] as unknown[]).map((v) =>
                typeof v === 'string' && /^\d+$/.test(v) ? parseInt(v, 10) : v
              );
            }
          }
        }
      } else if (val && typeof val === 'object') {
        convertIds(val, fields);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.$use(async (params: any, next: any) => {
    const fields = INT_ID_FIELDS[params.model ?? ''];
    if (fields && params.args) {
      const args = params.args as Record<string, unknown>;
      if (args.where) convertIds(args.where, fields);
      if (args.data) convertIds(args.data, fields);
    }
    return next(params);
  });

  return client;
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
