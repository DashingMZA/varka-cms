/**
 * Login diagnostic — run from packages/database:
 *   node diagnose-login.mjs
 * Checks: user exists, account exists, middleware works.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
for (const p of [resolve(here, '../../.env'), resolve(here, '.env')]) {
  if (existsSync(p)) { dotenv.config({ path: p }); break; }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const db = new PrismaClient({ adapter: new PrismaPg(pool) }).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, args, query }) {
        const f = INT_ID_FIELDS[model ?? ''];
        if (f && args) {
          if (args.where) convertIds(args.where, f);
          if (args.data) convertIds(args.data, f);
        }
        return query(args);
      },
    },
  },
});

// Apply the same middleware as src/client.ts
const INT_ID_FIELDS = {
  User: ['id'], Session: ['userId'], Account: ['userId'],
  TwoFactor: ['userId'], UserRole: ['userId'], AuthorProfile: ['userId'],
  Post: ['authorId'], Page: ['authorId'], Revision: ['authorId'],
  Comment: ['authorUserId'], MediaAsset: ['uploadedById'],
};
function convertIds(obj, fields) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) { for (const i of obj) convertIds(i, fields); return; }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (fields.includes(k)) {
      if (typeof v === 'string' && /^\d+$/.test(v)) obj[k] = parseInt(v, 10);
      else if (v && typeof v === 'object') {
        for (const op of ['equals','not','lt','lte','gt','gte'])
          if (typeof v[op] === 'string' && /^\d+$/.test(v[op])) v[op] = parseInt(v[op], 10);
      }
    } else if (v && typeof v === 'object') convertIds(v, fields);
  }
}
const email = process.argv[2] || 'admin@csofts.com';
console.log('1. Finding user by email:', email);
const user = await db.user.findFirst({ where: { email } });
console.log('   User:', user ? `id=${user.id} (type: ${typeof user.id})` : 'NOT FOUND');

if (user) {
  console.log('2. Finding credential account with STRING userId "1" (middleware test)...');
  try {
    const accounts = await db.account.findMany({
      where: { userId: "1", providerId: 'credential' },
    });
    console.log('   Accounts found:', accounts.length, accounts.length ? '(middleware WORKS)' : '(no credential account!)');
    if (accounts[0]) console.log('   Has password:', !!accounts[0].password);
  } catch (e) {
    console.log('   ERROR (middleware FAILED):', e.message.split('\n')[0]);
  }
}
await db.$disconnect();
