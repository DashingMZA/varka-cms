'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Export failed' };
}

export type ExportContentType = 'posts' | 'pages' | 'media' | 'categories' | 'tags' | 'comments';

export async function listScheduledPostsAction(): Promise<
  ActionResult<Array<{ id: string; scheduledAt: string | null; translations: Array<{ title: string; slug: string }> }>>
> {
  try {
    const { siteId } = await requireServerAuth('tools.export');
    const posts = await prisma.post.findMany({
      where: { siteId, status: 'SCHEDULED', deletedAt: null },
      select: {
        id: true,
        scheduledAt: true,
        translations: { select: { title: true, slug: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return { ok: true, data: JSON.parse(JSON.stringify(posts)) };
  } catch (e) {
    return fail(e);
  }
}

export async function importContentAction(
  json: string,
): Promise<ActionResult<{ imported: Record<string, number>; errors: string[] }>> {
  try {
    const { siteId } = await requireServerAuth('tools.import');
    const errors: string[] = [];
    const imported: Record<string, number> = {};

    let payload: { version?: string; generator?: string; data?: Record<string, unknown[]> };
    try {
      payload = JSON.parse(json);
    } catch {
      return { ok: false, error: 'Invalid JSON file' };
    }

    if (!payload.data || typeof payload.data !== 'object') {
      return { ok: false, error: 'Invalid export file format' };
    }

    const data = payload.data;

    // Import categories first (posts may reference them)
    if (Array.isArray(data.categories)) {
      let count = 0;
      for (const cat of data.categories as Array<{ name: string; slug: string; description?: string }>) {
        try {
          if (!cat.name || !cat.slug) continue;
          await prisma.category.upsert({
            where: { siteId_slug: { siteId, slug: cat.slug } },
            update: { name: cat.name, description: cat.description ?? null },
            create: { siteId, name: cat.name, slug: cat.slug, description: cat.description ?? null },
          });
          count++;
        } catch (e) {
          errors.push(`Category ${cat.slug}: ${e instanceof Error ? e.message : 'failed'}`);
        }
      }
      imported.categories = count;
    }

    // Import tags
    if (Array.isArray(data.tags)) {
      let count = 0;
      for (const tag of data.tags as Array<{ name: string; slug: string; description?: string }>) {
        try {
          if (!tag.name || !tag.slug) continue;
          await prisma.tag.upsert({
            where: { siteId_slug: { siteId, slug: tag.slug } },
            update: { name: tag.name, description: tag.description ?? null },
            create: { siteId, name: tag.name, slug: tag.slug, description: tag.description ?? null },
          });
          count++;
        } catch (e) {
          errors.push(`Tag ${tag.slug}: ${e instanceof Error ? e.message : 'failed'}`);
        }
      }
      imported.tags = count;
    }

    // Import posts
    if (Array.isArray(data.posts)) {
      let count = 0;
      for (const post of data.posts as Array<{
        status?: string;
        translations?: Array<{ languageId: string; title: string; slug: string; contentHtml?: string; excerpt?: string }>;
      }>) {
        try {
          const tr = post.translations?.[0];
          if (!tr?.title || !tr?.slug) continue;
          // Check if post with same slug exists
          const existing = await prisma.post.findFirst({
            where: { siteId, translations: { some: { slug: tr.slug } } },
          });
          if (existing) {
            errors.push(`Post ${tr.slug}: already exists, skipped`);
            continue;
          }
          await prisma.post.create({
            data: {
              siteId,
              status: (post.status as 'DRAFT' | 'PUBLISHED') ?? 'DRAFT',
              translations: {
                create: {
                  languageId: tr.languageId,
                  title: tr.title,
                  slug: tr.slug,
                  contentHtml: tr.contentHtml ?? '',
                  excerpt: tr.excerpt ?? null,
                },
              },
            },
          });
          count++;
        } catch (e) {
          errors.push(`Post: ${e instanceof Error ? e.message : 'failed'}`);
        }
      }
      imported.posts = count;
    }

    // Import pages
    if (Array.isArray(data.pages)) {
      let count = 0;
      for (const page of data.pages as Array<{
        status?: string;
        translations?: Array<{ languageId: string; title: string; slug: string; contentHtml?: string }>;
      }>) {
        try {
          const tr = page.translations?.[0];
          if (!tr?.title || !tr?.slug) continue;
          const existing = await prisma.page.findFirst({
            where: { siteId, translations: { some: { slug: tr.slug } } },
          });
          if (existing) {
            errors.push(`Page ${tr.slug}: already exists, skipped`);
            continue;
          }
          await prisma.page.create({
            data: {
              siteId,
              status: (page.status as 'DRAFT' | 'PUBLISHED') ?? 'DRAFT',
              translations: {
                create: {
                  languageId: tr.languageId,
                  title: tr.title,
                  slug: tr.slug,
                  contentHtml: tr.contentHtml ?? '',
                },
              },
            },
          });
          count++;
        } catch (e) {
          errors.push(`Page: ${e instanceof Error ? e.message : 'failed'}`);
        }
      }
      imported.pages = count;
    }

    return { ok: true, data: { imported, errors } };
  } catch (e) {
    return fail(e);
  }
}

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
