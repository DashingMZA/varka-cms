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

export type CreatePageInput = z.input<typeof createPageInput>;

function stripDangerousHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export async function listPages(
  db: PagesDb,
  ctx: AuthContext,
  opts: { siteId: string; limit?: number } = { siteId: '' },
) {
  requirePermission(ctx, 'pages.read');
  const limit = Math.min(opts.limit ?? 50, 100);
  const items = await db.page.findMany({
    where: { siteId: opts.siteId, deletedAt: null },
    take: limit,
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    include: { translations: true },
  });
  return { items };
}

export async function createPage(db: PagesDb, ctx: AuthContext, raw: CreatePageInput) {
  requirePermission(ctx, 'pages.create');
  const input = createPageInput.parse(raw);
  const slug = input.slug ? input.slug : slugify(input.title);
  assertSlugAllowed(slug);

  let languageId = input.languageId;
  if (!languageId) {
    const lang = await db.language.findFirst({
      where: { siteId: input.siteId, defaultLanguage: true },
    });
    if (!lang) throw new Error('No language found for site');
    languageId = lang.id;
  }

  const existing = await db.pageTranslation.findFirst({
    where: { languageId, slug },
  });
  if (existing) throw new Error(`Page slug already exists: ${slug}`);

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
