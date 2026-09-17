import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

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
      prisma.post.count({ where: { siteId: site.id } }),
      prisma.post.count({ where: { siteId: site.id, status: 'PUBLISHED' } }),
      prisma.post.count({ where: { siteId: site.id, status: 'DRAFT' } }),
      prisma.page.count({ where: { siteId: site.id } }),
      prisma.mediaAsset.count({ where: { siteId: site.id } }),
      prisma.comment.count({ where: { siteId: site.id } }),
      prisma.comment.count({ where: { siteId: site.id, status: 'PENDING' } }),
      prisma.user.count(),
      prisma.post.findMany({
        where: { siteId: site.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          translations: { take: 1, select: { title: true, slug: true } },
        },
      }),
      prisma.comment.findMany({
        where: { siteId: site.id },
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

    return NextResponse.json({
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
          updatedAt: p.updatedAt,
        })),
        comments: recentComments,
        audit: recentAudit,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
