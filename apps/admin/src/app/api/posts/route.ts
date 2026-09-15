import { NextResponse } from 'next/server';
import { createPost, listPosts } from '@varka/content';

/**
 * Posts collection API.
 * Auth: in production wire session → loadAuthContext.
 * Dev fallback uses owner-like context when AUTH is not fully wired.
 */
async function getCtx() {
  // TODO: replace with real session from Better Auth
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: [
      'posts.read',
      'posts.create',
      'posts.update',
      'posts.publish',
      'posts.delete',
    ],
  };
}

async function getDb() {
  const { prisma } = await import('@varka/database');
  return prisma;
}

async function getSiteId(db: { site: { findFirst: (a: unknown) => Promise<{ id: string } | null> } }) {
  const site = await db.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found — run seed');
  return site.id;
}

export async function GET() {
  try {
    const db = await getDb();
    const ctx = await getCtx();
    const siteId = await getSiteId(db as never);
    const result = await listPosts(db as never, ctx, { siteId });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { title?: string };
    const db = await getDb();
    const ctx = await getCtx();
    const siteId = await getSiteId(db as never);
    const post = await createPost(db as never, ctx, {
      siteId,
      title: body.title ?? 'Untitled',
      authorId: ctx.userId === 'dev-user' ? undefined : ctx.userId,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
