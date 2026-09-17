import { NextResponse } from 'next/server';
import { createPost, listPosts } from '@varka/content';
import { guard } from '@/lib/api-guard';

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
  const g = await guard(req, 'posts.read');
  if (g instanceof NextResponse) return g;
  try {
    const db = await getDb();
    const siteId = await getSiteId(db as never);
    const result = await listPosts(db as never, g.ctx, { siteId });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const g = await guard(req, 'posts.create');
  if (g instanceof NextResponse) return g;
  try {
    const body = (await req.json()) as { title?: string };
    const db = await getDb();
    const siteId = await getSiteId(db as never);
    const post = await createPost(db as never, g.ctx, {
      siteId,
      title: body.title ?? 'Untitled',
      authorId: g.ctx.userId === 'dev-user' ? undefined : g.ctx.userId,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
