import { createRequire } from 'node:module';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client') as {
  PrismaClient: new (args?: unknown) => import('@prisma/client').PrismaClient;
};

type Client = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: Client;
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

function createClient(): Client {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  const pool = globalForPrisma.pgPool ?? createPool(connectionString);
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool;
  }
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from '@prisma/client';
