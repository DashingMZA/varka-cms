import { NextResponse } from 'next/server';
import { updatePost, invalidatePostCache } from '@varka/content';
import { getCache } from '@varka/cache';

async function getCtx() {
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

export async function GET(
  _req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctxParams.params;
    const { prisma } = await import('@varka/database');
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        translations: true,
        categories: true,
        tags: true,
      },
    });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctxParams.params;
    const body = await req.json();
    const { prisma } = await import('@varka/database');
    const ctx = await getCtx();
    const post = await updatePost(prisma as never, ctx, id, body);
    try {
      const cache = await getCache();
      const siteId = (post as { siteId?: string }).siteId;
      const tr = (post as { translations?: Array<{ slug: string; language?: { locale?: string } }> }).translations?.[0];
      if (siteId) {
        await invalidatePostCache(cache, {
          siteId,
          slug: tr?.slug,
          locale: tr?.language?.locale,
        });
      }
    } catch { /* non-blocking */ }
    return NextResponse.json(post);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
