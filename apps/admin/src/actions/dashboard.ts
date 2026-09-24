'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function getDashboardAction(): Promise<
  ActionResult<{
    glance: Record<string, number>;
    activity: {
      posts: Array<{ id: string; title: string; status: string; updatedAt: string }>;
      comments: Array<{
        id: string;
        authorName: string;
        body: string;
        status: string;
        createdAt: string;
      }>;
      audit: Array<{
        id: string;
        action: string;
        entityType: string | null;
        createdAt: string;
        actorEmail: string | null;
      }>;
    };
  }>
> {
  try {
    const { siteId } = await requireServerAuth();
    const [
      postsTotal,
      postsPublished,
      postsDraft,
      pagesTotal,
      mediaTotal,
      commentsTotal,
      commentsPending,
      usersTotal,
      recentPosts,
      recentComments,
      recentAudit,
    ] = await Promise.all([
      prisma.post.count({ where: { siteId, deletedAt: null } }),
      prisma.post.count({ where: { siteId, deletedAt: null, status: 'PUBLISHED' } }),
      prisma.post.count({ where: { siteId, deletedAt: null, status: 'DRAFT' } }),
      prisma.page.count({ where: { siteId } }),
      prisma.mediaAsset.count({ where: { siteId } }),
      prisma.comment.count({ where: { siteId } }),
      prisma.comment.count({ where: { siteId, status: 'PENDING' } }),
      prisma.user.count(),
      prisma.post.findMany({
        where: { siteId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { translations: { take: 1 } },
      }),
      prisma.comment.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }).catch(() => []),
    ]);

    return {
      ok: true,
      data: {
        glance: {
          posts: postsTotal,
          postsPublished,
          postsDraft,
          pages: pagesTotal,
          media: mediaTotal,
          comments: commentsTotal,
          commentsPending,
          users: usersTotal,
        },
        activity: {
          posts: recentPosts.map((p) => ({
            id: p.id,
            title: p.translations[0]?.title ?? 'Untitled',
            status: p.status,
            updatedAt: p.updatedAt.toISOString(),
          })),
          comments: recentComments.map((c) => ({
            id: c.id,
            authorName: c.authorName ?? 'Anonymous',
            body: c.body ?? '',
            status: c.status,
            createdAt: c.createdAt.toISOString(),
          })),
          audit: (recentAudit as Array<{
            id: string;
            action: string;
            entityType: string | null;
            createdAt: Date;
            actorEmail: string | null;
          }>).map((a) => ({
            id: a.id,
            action: a.action,
            entityType: a.entityType,
            createdAt: a.createdAt.toISOString(),
            actorEmail: a.actorEmail,
          })),
        },
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}
