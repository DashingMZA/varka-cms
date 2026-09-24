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
}): Promise<ActionResult<{ items: unknown[]; counts: Record<string, number> }>> {
  try {
    const { siteId } = await requireServerAuth('posts.read');
    const limit = Math.min(opts?.limit ?? 100, 200);
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

    const [items, all, published, draft, trashed] = await Promise.all([
      prisma.post.findMany({
        where: where as never,
        take: limit,
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
        },
      }),
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

export async function bulkPostsAction(
  ids: string[],
  action: 'publish' | 'draft' | 'trash',
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireServerAuth(
      action === 'trash' ? 'posts.delete' : action === 'publish' ? 'posts.publish' : 'posts.update',
    );
    if (!ids.length) return { ok: true, data: { count: 0 } };
    if (action === 'trash') {
      await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { status: 'TRASHED', deletedAt: new Date() },
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
        posts: posts.map((p) => ({
          id: p.id,
          title: p.translations[0]?.title ?? 'Untitled',
          slug: p.translations[0]?.slug ?? p.id,
          type: 'post' as const,
        })),
        pages: pages.map((p) => ({
          id: p.id,
          title: p.translations[0]?.title ?? 'Untitled',
          slug: p.translations[0]?.slug ?? p.id,
          type: 'page' as const,
        })),
      },
    };
  } catch (e) {
    return fail(e);
  }
}

void getServerAuth;
void getSiteId;
