/**
 * Seed: Site VARKA, English + optional Punjabi, RBAC, optional owner.
 * Prisma 7 + driver adapter (pg).
 */
import path from 'node:path';
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
    ...(needsSsl
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  });
}

const pool = createPool(connectionString);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

  // Punjabi: one language row + script field (not two language rows)
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
  console.log('Languages: en (default), pa (prefix /pa)');

  await prisma.siteSetting.upsert({
    where: { siteId_key: { siteId: site.id, key: 'brand.name' } },
    update: { value: 'VARKA' },
    create: { siteId: site.id, key: 'brand.name', value: 'VARKA' },
  });

  await prisma.siteSetting.upsert({
    where: { siteId_key: { siteId: site.id, key: 'seo.titleTemplate' } },
    update: {},
    create: { siteId: site.id, key: 'seo.titleTemplate', value: '%s · VARKA' },
  });
  await prisma.siteSetting.upsert({
    where: { siteId_key: { siteId: site.id, key: 'seo.defaultDescription' } },
    update: {},
    create: {
      siteId: site.id,
      key: 'seo.defaultDescription',
      value: 'Editorial publishing with VARKA',
    },
  });
  await prisma.siteSetting.upsert({
    where: { siteId_key: { siteId: site.id, key: 'seo.robotsIndex' } },
    update: {},
    create: { siteId: site.id, key: 'seo.robotsIndex', value: true },
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

  const ownerEmail = process.env.SEED_OWNER_EMAIL;
  if (ownerEmail) {
    let user = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: ownerEmail,
          name: 'Owner',
          emailVerified: true,
          siteId: site.id,
        },
      });
      console.log('Created owner user (set password via Better Auth):', ownerEmail);
    } else {
      console.log('Owner user exists:', ownerEmail);
    }
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'owner' } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: ownerRole.id } },
      update: {},
      create: { userId: user.id, roleId: ownerRole.id },
    });
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
