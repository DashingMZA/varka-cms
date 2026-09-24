import { NextResponse } from 'next/server';
import { updatePost, invalidatePostCache } from '@varka/content';
import { getCache } from '@varka/cache';
import { getAuthContext } from '@/lib/auth-context';
import { guard } from '@/lib/api-guard';

export async function GET(
  req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  const g = await guard(req, 'posts.read');
  if (g instanceof NextResponse) return g;
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
  const g = await guard(req, 'posts.update');
  if (g instanceof NextResponse) return g;
  try {
    const { id } = await ctxParams.params;
    const body = await req.json();
    const { prisma } = await import('@varka/database');
    // Prefer real session user; guard already resolved ctx
    const ctx = g.ctx.userId ? g.ctx : await getAuthContext(req);
    const post = await updatePost(prisma as never, ctx, id, body);
    try {
      const cache = await getCache();
      const siteId = (post as { siteId?: string }).siteId;
      const tr = (
        post as {
          translations?: Array<{ slug: string; language?: { locale?: string } }>;
        }
      ).translations?.[0];
      if (siteId) {
        await invalidatePostCache(cache, {
          siteId,
          slug: tr?.slug,
          locale: tr?.language?.locale,
        });
      }
    } catch {
      /* non-blocking */
    }
    return NextResponse.json(post);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
