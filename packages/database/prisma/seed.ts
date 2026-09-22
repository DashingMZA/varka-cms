/**
 * Seed: Site VARKA, English + RBAC + owner with Better Auth credential Account.
 * Prisma 7 + driver adapter (pg).
 */
import path from 'node:path';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client') as {
  PrismaClient: new (args?: unknown) => any;
};

function loadRootEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../.env'),
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      console.log('Loaded env:', file);
      return file;
    }
  }
  return null;
}
loadRootEnv();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Put it in the repository root .env file.');
}

function createPool(url: string): Pool {
  const needsSsl =
    url.includes('sslmode=') ||
    url.includes('db.prisma.io') ||
    url.includes('amazonaws.com') ||
    url.includes('neon.tech') ||
    url.includes('supabase');

  return new Pool({
    connectionString: url,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 10_000,
    max: 2,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

const pool = createPool(connectionString);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const scryptAsync = promisify(scryptCb);

async function hashSeedPassword(password: string): Promise<string> {
  try {
    const argon2 = await import('@node-rs/argon2');
    return await argon2.hash(password, {
      memoryCost: Number(process.env.AUTH_ARGON2_MEMORY_KIB ?? 19456),
      timeCost: Number(process.env.AUTH_ARGON2_TIME_COST ?? 2),
      parallelism: Number(process.env.AUTH_ARGON2_PARALLELISM ?? 1),
      outputLen: 32,
      algorithm: argon2.Algorithm.Argon2id,
    });
  } catch {
    const N = 131072;
    const r = 8;
    const p = 1;
    const salt = randomBytes(16);
    const derived = (await scryptAsync(password, salt, 32, {
      N,
      r,
      p,
      maxmem: 256 * 1024 * 1024,
    })) as Buffer;
    return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
  }
}

const ROLES: { slug: string; name: string; description: string }[] = [
  { slug: 'owner', name: 'Owner', description: 'Full control' },
  { slug: 'admin', name: 'Admin', description: 'Administer site' },
  { slug: 'editor', name: 'Editor', description: 'Edit and publish' },
  { slug: 'author', name: 'Author', description: 'Write own posts' },
  { slug: 'contributor', name: 'Contributor', description: 'Draft only' },
  { slug: 'seo_manager', name: 'SEO Manager', description: 'SEO settings' },
  { slug: 'translator', name: 'Translator', description: 'Translations' },
  { slug: 'reader', name: 'Reader', description: 'Read-only admin' },
];

const PERMISSIONS = [
  'posts.read', 'posts.create', 'posts.update', 'posts.publish', 'posts.delete',
  'pages.read', 'pages.create', 'pages.update', 'pages.publish', 'pages.delete',
  'media.read', 'media.upload', 'media.update', 'media.delete',
  'comments.read', 'comments.moderate', 'comments.delete',
  'themes.read', 'themes.customize', 'themes.activate',
  'seo.read', 'seo.update',
  'settings.read', 'settings.update',
  'users.read', 'users.create', 'users.update', 'users.disable',
  'languages.read', 'languages.manage',
  'audit.read', 'security.read', 'security.manage',
] as const;

const ROLE_PERMS: Record<string, readonly string[]> = {
  owner: PERMISSIONS,
  admin: PERMISSIONS.filter((p) => !p.startsWith('security.manage')),
  editor: [
    'posts.read', 'posts.create', 'posts.update', 'posts.publish', 'posts.delete',
    'pages.read', 'pages.create', 'pages.update', 'pages.publish',
    'media.read', 'media.upload', 'media.update',
    'comments.read', 'comments.moderate',
    'seo.read', 'seo.update', 'languages.read',
  ],
  author: ['posts.read', 'posts.create', 'posts.update', 'media.read', 'media.upload', 'comments.read'],
  contributor: ['posts.read', 'posts.create', 'posts.update', 'media.read'],
  seo_manager: ['posts.read', 'pages.read', 'seo.read', 'seo.update', 'languages.read'],
  translator: ['posts.read', 'posts.update', 'pages.read', 'pages.update', 'languages.read'],
  reader: ['posts.read', 'pages.read', 'media.read', 'comments.read', 'seo.read', 'languages.read'],
};

async function main() {
  console.log('Connecting to database…');
  await pool.query('select 1 as ok');
  console.log('Database connection OK');

  const site = await prisma.site.upsert({
    where: { slug: 'varka' },
    update: { name: 'VARKA' },
    create: { name: 'VARKA', slug: 'varka' },
  });
  console.log('Site:', site.slug);

  await prisma.language.upsert({
    where: { siteId_locale: { siteId: site.id, locale: 'en' } },
    update: { defaultLanguage: true, enabled: true, urlPrefix: '' },
    create: {
      siteId: site.id,
      name: 'English',
      nativeName: 'English',
      locale: 'en',
      languageCode: 'en',
      script: 'Latn',
      direction: 'ltr',
      enabled: true,
      defaultLanguage: true,
      urlPrefix: '',
      displayOrder: 0,
    },
  });

  await prisma.language.upsert({
    where: { siteId_locale: { siteId: site.id, locale: 'pa' } },
    update: { enabled: true, urlPrefix: 'pa', script: 'Arab' },
    create: {
      siteId: site.id,
      name: 'Punjabi',
      nativeName: 'پنجابی',
      locale: 'pa',
      languageCode: 'pa',
      script: 'Arab',
      direction: 'rtl',
      enabled: true,
      defaultLanguage: false,
      urlPrefix: 'pa',
      displayOrder: 1,
    },
  });

  await prisma.siteSetting.upsert({
    where: { siteId_key: { siteId: site.id, key: 'brand.name' } },
    update: { value: 'VARKA' },
    create: { siteId: site.id, key: 'brand.name', value: 'VARKA' },
  });

  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key },
    });
  }

  const permRows = await prisma.permission.findMany();
  const permByKey = new Map(permRows.map((p: { key: string; id: string }) => [p.key, p.id]));

  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description },
      create: r,
    });
    const keys = ROLE_PERMS[r.slug] ?? [];
    for (const key of keys) {
      const permissionId = permByKey.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
  console.log('Roles & permissions seeded');

  const ownerEmailRaw = process.env.SEED_OWNER_EMAIL;
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;
  if (ownerEmailRaw) {
    const ownerEmail = ownerEmailRaw.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!user) {
      const rows = await prisma.$queryRaw<
        { id: string; email: string }[]
      >`SELECT id, email FROM "User" WHERE lower(email) = ${ownerEmail} LIMIT 1`;
      if (rows[0]) {
        user = await prisma.user.update({
          where: { id: rows[0].id },
          data: { email: ownerEmail, emailVerified: true },
        });
        console.log('Normalized owner email to lowercase:', ownerEmail);
      }
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: ownerEmail,
          name: process.env.SEED_OWNER_NAME ?? 'Owner',
          emailVerified: true,
          siteId: site.id,
          disabled: false,
        },
      });
      console.log('Created owner user:', ownerEmail, user.id);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, disabled: false, siteId: user.siteId ?? site.id },
      });
      console.log('Owner user exists:', ownerEmail, user.id);
    }

    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'owner' } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: ownerRole.id } },
      update: {},
      create: { userId: user.id, roleId: ownerRole.id },
    });

    if (ownerPassword) {
      if (ownerPassword.length < 12) {
        throw new Error('SEED_OWNER_PASSWORD must be at least 12 characters (auth policy)');
      }
      const passwordHash = await hashSeedPassword(ownerPassword);
      const existing = await prisma.account.findFirst({
        where: { userId: user.id, providerId: 'credential' },
      });
      if (existing) {
        await prisma.account.update({
          where: { id: existing.id },
          data: { password: passwordHash, accountId: user.id },
        });
        console.log('Updated credential Account for', ownerEmail, existing.id);
      } else {
        await prisma.account.deleteMany({
          where: { providerId: 'credential', accountId: ownerEmail, userId: { not: user.id } },
        });
        const created = await prisma.account.create({
          data: {
            userId: user.id,
            accountId: user.id,
            providerId: 'credential',
            password: passwordHash,
          },
        });
        console.log('Created credential Account for', ownerEmail, created.id);
      }
    } else {
      console.log('SEED_OWNER_PASSWORD not set — login will fail until set.');
    }
  } else {
    console.log('SEED_OWNER_EMAIL not set — skip owner user');
  }

  console.log('Seed complete for site', site.slug);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      /* ignore */
    }
    try {
      await pool.end();
    } catch {
      /* ignore */
    }
  });
