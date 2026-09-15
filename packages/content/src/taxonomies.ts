import type { AuthContext } from '@varka/permissions';
import { requirePermission } from '@varka/permissions';
import { slugify } from './slug';

export type TaxonomyDb = {
  category: {
    findMany: (args: unknown) => Promise<unknown[]>;
    create: (args: unknown) => Promise<unknown>;
  };
  tag: {
    findMany: (args: unknown) => Promise<unknown[]>;
    create: (args: unknown) => Promise<unknown>;
  };
  language: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
  };
};

export async function listCategories(db: TaxonomyDb, ctx: AuthContext, siteId: string) {
  requirePermission(ctx, 'posts.read');
  const items = await db.category.findMany({
    where: { siteId },
    include: { translations: true },
    orderBy: { sortOrder: 'asc' },
  });
  return { items };
}

export async function listTags(db: TaxonomyDb, ctx: AuthContext, siteId: string) {
  requirePermission(ctx, 'posts.read');
  const items = await db.tag.findMany({
    where: { siteId },
    include: { translations: true },
  });
  return { items };
}

export async function createCategory(
  db: TaxonomyDb,
  ctx: AuthContext,
  opts: { siteId: string; name: string; languageId?: string },
) {
  requirePermission(ctx, 'posts.update');
  let languageId = opts.languageId;
  if (!languageId) {
    const lang = await db.language.findFirst({
      where: { siteId: opts.siteId, defaultLanguage: true },
    });
    if (!lang) throw new Error('No language');
    languageId = lang.id;
  }
  const slug = slugify(opts.name);
  return db.category.create({
    data: {
      siteId: opts.siteId,
      translations: {
        create: { languageId, name: opts.name, slug },
      },
    },
    include: { translations: true },
  });
}

export async function createTag(
  db: TaxonomyDb,
  ctx: AuthContext,
  opts: { siteId: string; name: string; languageId?: string },
) {
  requirePermission(ctx, 'posts.update');
  let languageId = opts.languageId;
  if (!languageId) {
    const lang = await db.language.findFirst({
      where: { siteId: opts.siteId, defaultLanguage: true },
    });
    if (!lang) throw new Error('No language');
    languageId = lang.id;
  }
  const slug = slugify(opts.name);
  return db.tag.create({
    data: {
      siteId: opts.siteId,
      translations: {
        create: { languageId, name: opts.name, slug },
      },
    },
    include: { translations: true },
  });
}
