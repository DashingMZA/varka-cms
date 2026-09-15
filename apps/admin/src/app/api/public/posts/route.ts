import { NextResponse } from 'next/server';
import { listPublishedPostsCached } from '@varka/content';
import { getCache } from '@varka/cache';

/** Public published posts list — Cache-Control for CDN/browser */
export async function GET(req: Request) {
  try {
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const cache = await getCache();
    const items = await listPublishedPostsCached(prisma as never, cache, {
      siteId: site.id,
      locale,
      limit,
    });

    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
