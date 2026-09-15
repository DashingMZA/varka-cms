import { NextResponse } from 'next/server';
import { commentCounts, moderateList, submitComment } from '@varka/content';

async function getCtx() {
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: [
      'comments.read',
      'comments.moderate',
      'comments.delete',
    ],
  };
}

async function getSiteId(db: {
  site: { findFirst: (a: unknown) => Promise<{ id: string } | null> };
}) {
  const site = await db.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found');
  return site.id;
}

export async function GET(req: Request) {
  try {
    const { prisma } = await import('@varka/database');
    const ctx = await getCtx();
    const siteId = await getSiteId(prisma as never);
    const url = new URL(req.url);
    if (url.searchParams.get('counts') === '1') {
      const counts = await commentCounts(prisma as never, ctx, siteId);
      return NextResponse.json(counts);
    }
    const status = url.searchParams.get('status') ?? undefined;
    const result = await moderateList(prisma as never, ctx, { siteId, status });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Staff can also create a comment (e.g. reply as admin) */
export async function POST(req: Request) {
  try {
    const { prisma } = await import('@varka/database');
    const siteId = await getSiteId(prisma as never);
    const body = await req.json();
    const comment = await submitComment(prisma as never, { ...body, siteId });
    return NextResponse.json(comment, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
