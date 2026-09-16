import { z } from 'zod';
import type { AuthContext } from '@varka/permissions';
import { requirePermission } from '@varka/permissions';
import { slugify, assertSlugAllowed } from './slug';
import type { ContentDb } from './posts';

export type PagesDb = ContentDb & {
  page: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
  pageTranslation: {
    findFirst: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
};

export const createPageInput = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200).optional(),
  languageId: z.string().min(1).optional(),
  contentHtml: z.string().optional().default(''),
  template: z.string().optional(),
});

export const updatePageInput = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z.string().min(1).max(200).optional(),
  contentHtml: z.string().optional(),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(500).nullable().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'TRASHED']).optional(),
  template: z.string().optional(),
  languageId: z.string().optional(),
  version: z.number().int().optional(),
});

export type CreatePageInput = z.input<typeof createPageInput>;
export type UpdatePageInput = z.input<typeof updatePageInput>;

function stripDangerousHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

async function uniquePageSlug(
  db: PagesDb,
  languageId: string,
  base: string,
  excludePageId?: string,
): Promise<string> {
  let slug = base || 'page';
  assertSlugAllowed(slug);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i}`;
    const existing = (await db.pageTranslation.findFirst({
      where: {
        languageId,
        slug: candidate,
        ...(excludePageId ? { pageId: { not: excludePageId } } : {}),
      },
    })) as { id: string } | null;
    if (!existing) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

export async function listPages(
  db: PagesDb,
  ctx: AuthContext,
  opts: { siteId: string; status?: string; limit?: number } = { siteId: '' },
) {
  requirePermission(ctx, 'pages.read');
  const limit = Math.min(opts.limit ?? 50, 100);
  const items = await db.page.findMany({
    where: {
      siteId: opts.siteId,
      deletedAt: null,
      ...(opts.status ? { status: opts.status } : {}),
    },
    take: limit,
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    include: {
      translations: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });
  return { items };
}

export async function getPage(db: PagesDb, ctx: AuthContext, id: string) {
  requirePermission(ctx, 'pages.read');
  const page = await db.page.findUnique({
    where: { id },
    include: {
      translations: true,
      author: { select: { id: true, name: true, email: true } },
      parent: { include: { translations: true } },
    },
  });
  if (!page) throw new Error('Page not found');
  return page;
}

export async function createPage(db: PagesDb, ctx: AuthContext, raw: CreatePageInput) {
  requirePermission(ctx, 'pages.create');
  const input = createPageInput.parse(raw);
  const baseSlug = input.slug ? input.slug : slugify(input.title);

  let languageId = input.languageId;
  if (!languageId) {
    const lang = (await db.language.findFirst({
      where: { siteId: input.siteId, defaultLanguage: true },
    })) as { id: string } | null;
    if (!lang) throw new Error('No language found for site');
    languageId = lang.id;
  }

  const slug = await uniquePageSlug(db, languageId, baseSlug);

  return db.page.create({
    data: {
      siteId: input.siteId,
      authorId: ctx.userId === 'dev-user' ? undefined : ctx.userId,
      status: 'DRAFT',
      template: input.template ?? 'default',
      translations: {
        create: {
          languageId,
          title: input.title,
          slug,
          contentHtml: stripDangerousHtml(input.contentHtml ?? ''),
          status: 'DRAFT',
        },
      },
    },
    include: { translations: true },
  });
}

export async function updatePage(
  db: PagesDb,
  ctx: AuthContext,
  id: string,
  raw: UpdatePageInput,
) {
  requirePermission(ctx, 'pages.update');
  const input = updatePageInput.parse(raw);
  const page = (await db.page.findUnique({
    where: { id },
    include: { translations: true },
  })) as {
    id: string;
    version: number;
    translations: Array<{ id: string; languageId: string; slug: string }>;
  } | null;
  if (!page) throw new Error('Page not found');

  if (input.version !== undefined && input.version !== page.version) {
    throw new Error('Version conflict — reload and try again');
  }

  const tr =
    (input.languageId
      ? page.translations.find((t) => t.languageId === input.languageId)
      : page.translations[0]) ?? page.translations[0];
  if (!tr) throw new Error('No translation');

  let nextSlug = tr.slug;
  if (input.slug) {
    nextSlug = await uniquePageSlug(db, tr.languageId, input.slug, id);
  } else if (input.title) {
    // only auto-update slug if it still matches old auto pattern — keep manual
  }

  await db.pageTranslation.update({
    where: { id: tr.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.slug !== undefined ? { slug: nextSlug } : {}),
      ...(input.contentHtml !== undefined
        ? { contentHtml: stripDangerousHtml(input.contentHtml) }
        : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined
        ? { seoDescription: input.seoDescription }
        : {}),
      ...(input.status ? { status: input.status } : {}),
    },
  });

  await db.page.update({
    where: { id },
    data: {
      version: { increment: 1 },
      ...(input.status ? { status: input.status } : {}),
      ...(input.status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
      ...(input.template ? { template: input.template } : {}),
      ...(input.status === 'TRASHED' ? { deletedAt: new Date() } : {}),
    },
  });

  return getPage(db, ctx, id);
}

export async function trashPage(db: PagesDb, ctx: AuthContext, id: string) {
  requirePermission(ctx, 'pages.delete');
  return updatePage(db, ctx, id, { status: 'TRASHED' });
}
