import { z } from 'zod';
import type { AuthContext } from '@varka/permissions';
import { requirePermission } from '@varka/permissions';
import { slugify, assertSlugAllowed } from './slug';

/** Prisma-like client surface used by services (keeps package testable). */
export type ContentDb = {
  language: {
    findFirst: (args: unknown) => Promise<{ id: string; locale: string } | null>;
  };
  post: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
  postTranslation: {
    findFirst: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
  postCategory?: {
    deleteMany: (args: unknown) => Promise<unknown>;
    createMany?: (args: unknown) => Promise<unknown>;
  };
  postTag?: {
    deleteMany: (args: unknown) => Promise<unknown>;
    createMany?: (args: unknown) => Promise<unknown>;
  };
  revision: {
    create: (args: unknown) => Promise<unknown>;
  };
  $transaction: <T>(fn: (tx: ContentDb) => Promise<T>) => Promise<T>;
};

export const createPostInput = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200).optional(),
  languageId: z.string().min(1).optional(),
  locale: z.string().optional(),
  excerpt: z.string().max(2000).optional(),
  contentHtml: z.string().optional().default(''),
  authorId: z.string().optional(),
});

export type CreatePostInput = z.input<typeof createPostInput>;

export const updatePostInput = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(2000).optional().nullable(),
  contentHtml: z.string().optional(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  featuredImageId: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'TRASHED']).optional(),
  version: z.number().int().positive(),
  languageId: z.string().min(1),
});

export type UpdatePostInput = z.infer<typeof updatePostInput>;

function stripDangerousHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

const postInclude = {
  translations: true,
  author: { select: { id: true, name: true, email: true } },
  categories: { include: { category: { include: { translations: true } } } },
  tags: { include: { tag: { include: { translations: true } } } },
  featuredImage: true,
};

async function uniqueSlug(
  db: ContentDb,
  languageId: string,
  base: string,
): Promise<string> {
  let candidate = base;
  let n = 0;
  while (true) {
    const existing = await db.postTranslation.findFirst({
      where: { languageId, slug: candidate },
    });
    if (!existing) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) {
      candidate = `${base}-${Date.now().toString(36)}`;
      return candidate;
    }
  }
}

export async function listPosts(
  db: ContentDb,
  ctx: AuthContext,
  opts: { siteId: string; cursor?: string; limit?: number; status?: string } = {
    siteId: '',
  },
) {
  requirePermission(ctx, 'posts.read');
  const limit = Math.min(opts.limit ?? 20, 100);
  const items = (await db.post.findMany({
    where: {
      siteId: opts.siteId,
      ...(opts.status ? { status: opts.status } : {}),
      deletedAt: null,
    },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    orderBy: { updatedAt: 'desc' },
    include: postInclude,
  })) as Array<{ id: string }>;

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    hasMore,
  };
}

export async function getPost(db: ContentDb, ctx: AuthContext, postId: string) {
  requirePermission(ctx, 'posts.read');
  const post = await db.post.findUnique({
    where: { id: postId },
    include: postInclude,
  });
  if (!post) throw new Error('Post not found');
  return post;
}

export async function createPost(db: ContentDb, ctx: AuthContext, raw: CreatePostInput) {
  requirePermission(ctx, 'posts.create');
  const input = createPostInput.parse(raw);
  const baseSlug = input.slug ? input.slug : slugify(input.title);
  assertSlugAllowed(baseSlug);

  let languageId = input.languageId;
  if (!languageId) {
    const lang = await db.language.findFirst({
      where: {
        siteId: input.siteId,
        ...(input.locale ? { locale: input.locale } : { defaultLanguage: true }),
      },
    });
    if (!lang) throw new Error('No language found for site');
    languageId = lang.id;
  }

  const slug = await uniqueSlug(db, languageId, baseSlug);

  const contentHtml = stripDangerousHtml(input.contentHtml ?? '');
  const authorId =
    input.authorId ?? (ctx.userId && ctx.userId !== 'dev-user' ? ctx.userId : undefined);

  return db.post.create({
    data: {
      siteId: input.siteId,
      authorId,
      status: 'DRAFT',
      translations: {
        create: {
          languageId,
          title: input.title,
          slug,
          excerpt: input.excerpt,
          contentHtml,
          status: 'DRAFT',
        },
      },
    },
    include: postInclude,
  });
}

export async function updatePost(
  db: ContentDb,
  ctx: AuthContext,
  postId: string,
  raw: UpdatePostInput,
) {
  requirePermission(ctx, 'posts.update');
  const input = updatePostInput.parse(raw);

  const post = (await db.post.findUnique({
    where: { id: postId },
    include: { translations: true },
  })) as {
    id: string;
    siteId: string;
    version: number;
    status: string;
    translations: Array<{
      id: string;
      languageId: string;
      slug: string;
      title: string;
      contentHtml: string;
    }>;
  } | null;

  if (!post) throw new Error('Post not found');
  if (post.version !== input.version) {
    throw new Error('Stale edit — reload and try again');
  }

  const translation = post.translations.find((t) => t.languageId === input.languageId);
  if (!translation) throw new Error('Translation not found');

  if (input.slug) assertSlugAllowed(input.slug);

  const nextHtml =
    input.contentHtml !== undefined ? stripDangerousHtml(input.contentHtml) : translation.contentHtml;

  return db.$transaction(async (tx) => {
    await tx.revision.create({
      data: {
        postId,
        authorId: ctx.userId === 'dev-user' ? undefined : ctx.userId,
        languageId: input.languageId,
        title: input.title ?? translation.title,
        contentHtml: nextHtml,
        note: 'autosave/update',
      },
    });

    await tx.postTranslation.update({
      where: { id: translation.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
        ...(input.contentHtml !== undefined ? { contentHtml: nextHtml } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    if (input.categoryIds !== undefined && tx.postCategory) {
      await tx.postCategory.deleteMany({ where: { postId } });
      if (input.categoryIds.length > 0 && tx.postCategory.createMany) {
        await tx.postCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({ postId, categoryId })),
          skipDuplicates: true,
        });
      }
    }

    if (input.tagIds !== undefined && tx.postTag) {
      await tx.postTag.deleteMany({ where: { postId } });
      if (input.tagIds.length > 0 && tx.postTag.createMany) {
        await tx.postTag.createMany({
          data: input.tagIds.map((tagId) => ({ postId, tagId })),
          skipDuplicates: true,
        });
      }
    }

    const publishFields: Record<string, unknown> = {
      version: { increment: 1 },
    };
    if (input.featuredImageId !== undefined) {
      publishFields.featuredImageId = input.featuredImageId;
    }
    if (input.status === 'PUBLISHED') {
      requirePermission(ctx, 'posts.publish');
      publishFields.status = 'PUBLISHED';
      publishFields.publishedAt = new Date();
      publishFields.deletedAt = null;
    } else if (input.status) {
      if (input.status === 'TRASHED') requirePermission(ctx, 'posts.delete');
      publishFields.status = input.status;
      if (input.status === 'TRASHED') publishFields.deletedAt = new Date();
    }

    return tx.post.update({
      where: { id: postId },
      data: publishFields,
      include: postInclude,
    });
  });
}

export async function publishPost(db: ContentDb, ctx: AuthContext, postId: string, languageId: string) {
  const post = (await db.post.findUnique({ where: { id: postId } })) as {
    version: number;
  } | null;
  if (!post) throw new Error('Post not found');
  return updatePost(db, ctx, postId, {
    version: post.version,
    languageId,
    status: 'PUBLISHED',
  });
}

export async function trashPost(
  db: ContentDb,
  ctx: AuthContext,
  postId: string,
  languageId: string,
) {
  const post = (await db.post.findUnique({ where: { id: postId } })) as {
    version: number;
  } | null;
  if (!post) throw new Error('Post not found');
  return updatePost(db, ctx, postId, {
    version: post.version,
    languageId,
    status: 'TRASHED',
  });
}
