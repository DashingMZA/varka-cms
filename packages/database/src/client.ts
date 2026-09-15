import { createRequire } from 'node:module';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/** Loose client type — avoids depending on generated PrismaClient export at typecheck time. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrismaClient = any;

const require = createRequire(import.meta.url);

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
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
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

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
