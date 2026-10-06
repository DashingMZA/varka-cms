'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';

import type { ActionResult } from './posts';

export async function getDashboardAction(): Promise<
  ActionResult<{
    glance: Record<string, number>;
    activity: {
      posts: Array<{ id: string; slug?: string; title: string; status: string; updatedAt: string }>;
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
      prisma.post.count({ where: { siteId } }),
      prisma.post.count({ where: { siteId, status: 'PUBLISHED' } }),
      prisma.post.count({ where: { siteId, status: 'DRAFT' } }),
      prisma.page.count({ where: { siteId } }),
      prisma.mediaAsset.count({ where: { siteId } }),
      prisma.comment.count({ where: { siteId } }),
      prisma.comment.count({ where: { siteId, status: 'PENDING' } }),
      prisma.user.count(),
      prisma.post.findMany({
        where: { siteId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          translations: { take: 1, select: { title: true, slug: true } },
        },
      }),
      prisma.comment.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          authorName: true,
          body: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
          actorEmail: true,
        },
      }),
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
          posts: recentPosts.map(
            (p: { id: string; translations: { title: string; slug: string }[]; status: string; updatedAt: Date }) => ({
              id: p.id,
              slug: p.translations[0]?.slug,
              title: p.translations[0]?.title ?? 'Untitled',
              status: p.status,
              updatedAt: p.updatedAt.toISOString(),
            }),
          ),
          comments: recentComments.map((c: { createdAt: Date }) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          })),
          audit: recentAudit.map((a: { createdAt: Date }) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
          })),
        },
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}
