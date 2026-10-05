'use server';

import { createPost, updatePost } from '@varka/content';
import { prisma, getSiteId, getServerAuth, requireServerAuth } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

export async function listPostsAction(opts?: {
  status?: string;
  q?: string;
  limit?: number;
  page?: number;
  perPage?: number;
  dateFilter?: string;
  categoryId?: string;
}): Promise<ActionResult<{ items: unknown[]; counts: Record<string, number>; total: number; page: number; perPage: number }>> {
  try {
    const { siteId } = await requireServerAuth('posts.read');
    const perPage = Math.min(opts?.perPage ?? 20, 100);
    const page = Math.max(opts?.page ?? 1, 1);
    const limit = Math.min(opts?.limit ?? perPage, 200);
    const status = opts?.status && opts.status !== 'all' ? opts.status.toUpperCase() : undefined;
    const q = opts?.q?.trim();

    const where: Record<string, unknown> = {
      siteId,
      deletedAt: null,
      ...(status ? { status } : {}),
    };

    if (q) {
      where.translations = {
        some: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        },
      };
    }

    // Date filter (YYYY-MM format)
    if (opts?.dateFilter) {
      const [year, month] = opts.dateFilter.split('-').map(Number);
      if (year && month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        where.publishedAt = { gte: start, lt: end };
      }
    }

    // Category filter
    if (opts?.categoryId) {
      where.categories = {
        some: { categoryId: opts.categoryId },
      };
    }

    const [items, total, all, published, draft, trashed] = await Promise.all([
      prisma.post.findMany({
        where: where as never,
        take: limit,
        skip: (page - 1) * perPage,
        orderBy: { updatedAt: 'desc' },
        include: {
          translations: true,
          author: { select: { id: true, name: true, email: true } },
          categories: {
            include: { category: { include: { translations: true } } },
          },
          tags: {
            include: { tag: { include: { translations: true } } },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.post.count({ where: where as never }),
      prisma.post.count({ where: { siteId, deletedAt: null } }),
      prisma.post.count({ where: { siteId, deletedAt: null, status: 'PUBLISHED' } }),
      prisma.post.count({ where: { siteId, deletedAt: null, status: 'DRAFT' } }),
      prisma.post.count({ where: { siteId, deletedAt: null, status: 'TRASHED' } }),
    ]);

    return {
      ok: true,
      data: {
        items: JSON.parse(JSON.stringify(items)),
        counts: { all, published, draft, trashed },
        total,
        page,
        perPage,
      },
    };
  } catch (e) {
    return fail(e);
  }
}

export async function getPostAction(postId: string): Promise<ActionResult<unknown>> {
  try {
    await requireServerAuth('posts.read');
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { translations: true, categories: true, tags: true },
    });
    if (!post) return { ok: false, error: 'Not found' };
    return { ok: true, data: JSON.parse(JSON.stringify(post)) };
  } catch (e) {
    return fail(e);
  }
}

export async function createPostAction(title = 'Untitled'): Promise<ActionResult<{ id: string }>> {
  try {
    const { ctx, siteId } = await requireServerAuth('posts.create');
    const post = (await createPost(prisma as never, ctx, {
      siteId,
      title,
      authorId: ctx.userId && ctx.userId !== 'dev-user' ? ctx.userId : undefined,
    })) as { id: string };
    revalidatePath('/content/posts');
    return { ok: true, data: { id: post.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function updatePostAction(
  postId: string,
  body: Record<string, unknown>,
): Promise<ActionResult<unknown>> {
  try {
    const { ctx } = await requireServerAuth('posts.update');
    const post = await updatePost(prisma as never, ctx, postId, body as never);
    revalidatePath('/content/posts');
    revalidatePath(`/content/posts/${postId}`);
    return { ok: true, data: JSON.parse(JSON.stringify(post)) };
  } catch (e) {
    return fail(e);
  }
}

export async function trashPostAction(postId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireServerAuth('posts.delete');
    await prisma.post.update({
      where: { id: postId },
      data: { status: 'TRASHED', deletedAt: new Date() },
    });
    revalidatePath('/content/posts');
    return { ok: true, data: { id: postId } };
  } catch (e) {
    return fail(e);
  }
}

export async function restorePostAction(postId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireServerAuth('posts.update');
    await prisma.post.update({
      where: { id: postId },
      data: { status: 'DRAFT', deletedAt: null },
    });
    revalidatePath('/content/posts');
    return { ok: true, data: { id: postId } };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePostPermanentlyAction(postId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireServerAuth('posts.delete');
    await prisma.post.delete({ where: { id: postId } });
    revalidatePath('/content/posts');
    return { ok: true, data: { id: postId } };
  } catch (e) {
    return fail(e);
  }
}

export async function emptyTrashAction(): Promise<ActionResult<{ count: number }>> {
  try {
    const { siteId } = await requireServerAuth('posts.delete');
    const result = await prisma.post.deleteMany({
      where: { siteId, status: 'TRASHED' },
    });
    revalidatePath('/content/posts');
    return { ok: true, data: { count: result.count } };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkPostsAction(
  ids: string[],
  action: 'publish' | 'draft' | 'trash' | 'restore' | 'deletePermanently',
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireServerAuth(
      action === 'trash' || action === 'deletePermanently'
        ? 'posts.delete'
        : action === 'publish'
          ? 'posts.publish'
          : 'posts.update',
    );
    if (!ids.length) return { ok: true, data: { count: 0 } };
    if (action === 'trash') {
      await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { status: 'TRASHED', deletedAt: new Date() },
      });
    } else if (action === 'restore') {
      await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { status: 'DRAFT', deletedAt: null },
      });
    } else if (action === 'deletePermanently') {
      await prisma.post.deleteMany({
        where: { id: { in: ids } },
      });
    } else {
      await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: {
          status: action === 'publish' ? 'PUBLISHED' : 'DRAFT',
          ...(action === 'publish' ? { publishedAt: new Date() } : {}),
        },
      });
    }
    revalidatePath('/content/posts');
    return { ok: true, data: { count: ids.length } };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkEditPostsAction(
  ids: string[],
  updates: { status?: 'DRAFT' | 'PUBLISHED' | 'PENDING_REVIEW' },
): Promise<ActionResult<{ count: number }>> {
  try {
    const { siteId } = await requireServerAuth('posts.update');
    if (!ids.length) return { ok: true, data: { count: 0 } };
    if (updates.status === 'PUBLISHED') {
      await requireServerAuth('posts.publish');
    }

    const data: Record<string, unknown> = {};
    if (updates.status) {
      data.status = updates.status;
      if (updates.status === 'PUBLISHED') {
        data.publishedAt = new Date();
      }
    }

    if (Object.keys(data).length === 0) {
      return { ok: true, data: { count: 0 } };
    }

    const result = await prisma.post.updateMany({
      where: { id: { in: ids }, siteId, deletedAt: null },
      data,
    });
    revalidatePath('/content/posts');
    return { ok: true, data: { count: result.count } };
  } catch (e) {
    return fail(e);
  }
}

export async function searchContentAction(q: string): Promise<
  ActionResult<{
    posts: Array<{ id: string; title: string; slug: string; type: 'post' }>;
    pages: Array<{ id: string; title: string; slug: string; type: 'page' }>;
  }>
> {
  try {
    const { siteId } = await requireServerAuth('posts.read');
    const query = q.trim();
    const filter = query
      ? {
          translations: {
            some: {
              OR: [
                { title: { contains: query, mode: 'insensitive' as const } },
                { slug: { contains: query, mode: 'insensitive' as const } },
              ],
            },
          },
        }
      : {};
    const [posts, pages] = await Promise.all([
      prisma.post.findMany({
        where: { siteId, deletedAt: null, ...filter } as never,
        take: 20,
        orderBy: { updatedAt: 'desc' },
        include: { translations: { take: 1 } },
      }),
      prisma.page.findMany({
        where: { siteId, ...filter } as never,
        take: 20,
        orderBy: { updatedAt: 'desc' },
        include: { translations: { take: 1 } },
      }),
    ]);
    return {
      ok: true,
      data: {
        posts: posts.map(
          (p: { id: string; translations: { title: string; slug: string }[] }) => ({
            id: p.id,
            title: p.translations[0]?.title ?? 'Untitled',
            slug: p.translations[0]?.slug ?? p.id,
            type: 'post' as const,
          }),
        ),
        pages: pages.map(
          (p: { id: string; translations: { title: string; slug: string }[] }) => ({
            id: p.id,
            title: p.translations[0]?.title ?? 'Untitled',
            slug: p.translations[0]?.slug ?? p.id,
            type: 'page' as const,
          }),
        ),
      },
    };
  } catch (e) {
    return fail(e);
  }
}

export async function listRevisionsAction(
  postId: string,
): Promise<ActionResult<{ items: unknown[] }>> {
  try {
    await requireServerAuth('posts.read');
    const items = await prisma.revision.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, title: true, note: true, createdAt: true },
    });
    return { ok: true, data: { items: JSON.parse(JSON.stringify(items)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function restoreRevisionAction(
  postId: string,
  revisionId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ctx } = await requireServerAuth('posts.write');
    const userId = ctx.userId;
    const rev = await prisma.revision.findFirst({ where: { id: revisionId, postId } });
    if (!rev) return fail(new Error('Revision not found'));

    await prisma.$transaction(async (tx: typeof prisma) => {
      const post = await tx.post.findUnique({
        where: { id: postId },
        include: { translations: true },
      });
      if (!post) throw new Error('Post not found');
      const tr = post.translations[0];
      if (tr) {
        await tx.postTranslation.update({
          where: { id: tr.id },
          data: {
            title: rev.title ?? tr.title,
            contentHtml:
              (rev as { contentHtml?: string | null }).contentHtml ?? tr.contentHtml,
            excerpt: (rev as { excerpt?: string | null }).excerpt ?? tr.excerpt,
          },
        });
      }
      await tx.revision.create({
        data: {
          postId,
          title: tr?.title ?? rev.title,
          contentHtml: tr?.contentHtml ?? null,
          note: `Restored from ${revisionId.slice(0, 8)}`,
          authorId: userId && userId !== 'dev-user' ? userId : null,
        } as never,
      });
    });

    revalidatePath('/content/posts');
    revalidatePath(`/content/posts/${postId}`);
    return { ok: true, data: { id: postId } };
  } catch (e) {
    return fail(e);
  }
}

void getServerAuth;
void getSiteId;
