'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Export failed' };
}

export type ExportContentType = 'posts' | 'pages' | 'media' | 'categories' | 'tags' | 'comments';

export async function exportContentAction(
  types: ExportContentType[],
): Promise<ActionResult<{ filename: string; json: string; counts: Record<string, number> }>> {
  try {
    const { siteId } = await requireServerAuth('tools.export');
    const data: Record<string, unknown[]> = {};
    const counts: Record<string, number> = {};

    if (types.includes('posts')) {
      const posts = await prisma.post.findMany({
        where: { siteId, deletedAt: null },
        include: { translations: true },
        orderBy: { createdAt: 'desc' },
      });
      data.posts = JSON.parse(JSON.stringify(posts));
      counts.posts = posts.length;
    }

    if (types.includes('pages')) {
      const pages = await prisma.page.findMany({
        where: { siteId, deletedAt: null },
        include: { translations: true },
        orderBy: { createdAt: 'desc' },
      });
      data.pages = JSON.parse(JSON.stringify(pages));
      counts.pages = pages.length;
    }

    if (types.includes('media')) {
      const media = await prisma.mediaAsset.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
      });
      data.media = JSON.parse(JSON.stringify(media));
      counts.media = media.length;
    }

    if (types.includes('categories')) {
      const categories = await prisma.category.findMany({
        where: { siteId },
        orderBy: { name: 'asc' },
      });
      data.categories = JSON.parse(JSON.stringify(categories));
      counts.categories = categories.length;
    }

    if (types.includes('tags')) {
      const tags = await prisma.tag.findMany({
        where: { siteId },
        orderBy: { name: 'asc' },
      });
      data.tags = JSON.parse(JSON.stringify(tags));
      counts.tags = tags.length;
    }

    if (types.includes('comments')) {
      const comments = await prisma.comment.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
      });
      data.comments = JSON.parse(JSON.stringify(comments));
      counts.comments = comments.length;
    }

    const payload = {
      version: '1.0',
      generator: 'VARKA CMS',
      exportedAt: new Date().toISOString(),
      siteId,
      data,
    };

    const date = new Date().toISOString().slice(0, 10);
    const filename = `varka-export-${date}.json`;

    return {
      ok: true,
      data: {
        filename,
        json: JSON.stringify(payload, null, 2),
        counts,
      },
    };
  } catch (e) {
    return fail(e);
  }
}
