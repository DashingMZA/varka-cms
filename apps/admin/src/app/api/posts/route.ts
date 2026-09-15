import { NextResponse } from 'next/server';
import { createPost, listPosts } from '@varka/content';
import { getAuthContext } from '@/lib/auth-context';

async function getDb() {
  const { prisma } = await import('@varka/database');
  return prisma;
}

async function getSiteId(db: {
  site: { findFirst: (a: unknown) => Promise<{ id: string } | null> };
}) {
  const site = await db.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found — run seed');
  return site.id;
}

export async function GET(req: Request) {
  try {
    const db = await getDb();
    const ctx = await getAuthContext(req);
    const siteId = await getSiteId(db as never);
    const result = await listPosts(db as never, ctx, { siteId });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { title?: string; contentHtml?: string };
    const db = await getDb();
    const ctx = await getAuthContext(req);
    const siteId = await getSiteId(db as never);
    const post = await createPost(db as never, ctx, {
      siteId,
      title: body.title ?? 'Untitled',
      contentHtml: body.contentHtml ?? '',
      authorId: ctx.userId === 'dev-user' ? undefined : ctx.userId || undefined,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    const status = message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
