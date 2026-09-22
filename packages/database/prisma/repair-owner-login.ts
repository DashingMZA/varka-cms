/**
 * One-shot: ensure User.email + Account(credential) match SEED_OWNER_* for Better Auth login.
 * Run: pnpm --filter @varka/database exec tsx prisma/repair-owner-login.ts
 */
import path from 'node:path';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (args?: unknown) => any };

function loadRootEnv() {
  for (const file of [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../.env'),
  ]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      console.log('Loaded env:', file);
      return;
    }
  }
}
loadRootEnv();

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing');

const pool = new Pool({
  connectionString: url,
  ssl: url.includes('sslmode=') || url.includes('prisma.io') ? { rejectUnauthorized: false } : undefined,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const scryptAsync = promisify(scryptCb);

async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = await import('@node-rs/argon2');
    return await argon2.hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      outputLen: 32,
      algorithm: argon2.Algorithm.Argon2id,
    });
  } catch {
    const salt = randomBytes(16);
    const derived = (await scryptAsync(password, salt, 32, {
      N: 131072,
      r: 8,
      p: 1,
      maxmem: 256 * 1024 * 1024,
    })) as Buffer;
    return `scrypt$131072$8$1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
  }
}

async function main() {
  const email = (process.env.SEED_OWNER_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD || '';
  if (!email || !password) {
    throw new Error('Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD in .env');
  }
  if (password.length < 12) throw new Error('Password min 12 chars');

  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: process.env.SEED_OWNER_NAME ?? 'Owner',
        emailVerified: true,
        disabled: false,
        siteId: site?.id,
      },
    });
    console.log('Created user', user.id);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, disabled: false },
    });
    console.log('Updated user', user.id);
  }

  const hash = await hashPassword(password);
  const existing = await prisma.account.findFirst({
    where: {
      OR: [
        { userId: user.id, providerId: 'credential' },
        { providerId: 'credential', accountId: email },
      ],
    },
  });
  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { userId: user.id, accountId: email, providerId: 'credential', password: hash },
    });
    console.log('Updated account', existing.id);
  } else {
    const acc = await prisma.account.create({
      data: { userId: user.id, accountId: email, providerId: 'credential', password: hash },
    });
    console.log('Created account', acc.id);
  }

  const checkU = await prisma.user.findUnique({ where: { email } });
  const checkA = await prisma.account.findFirst({
    where: { userId: checkU.id, providerId: 'credential' },
  });
  console.log('OK — login with', email, {
    userId: checkU?.id,
    hasPassword: Boolean(checkA?.password),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
