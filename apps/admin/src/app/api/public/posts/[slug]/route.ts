import { NextResponse } from 'next/server';
import { getPublishedPostBySlugCached } from '@varka/content';
import { getCache } from '@varka/cache';

export async function GET(
  req: Request,
  ctxParams: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctxParams.params;
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') ?? undefined;
    const cache = await getCache();
    const post = await getPublishedPostBySlugCached(prisma as never, cache, {
      siteId: site.id,
      slug,
      locale,
    });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(post, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
