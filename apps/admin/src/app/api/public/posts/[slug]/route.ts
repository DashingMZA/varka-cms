import { NextResponse } from 'next/server';
import { getPublishedPostBySlugCached } from '@varka/content';
import { getCache } from '@varka/cache';

function cors(req: Request): HeadersInit {
  const origin = req.headers.get('origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}

export async function GET(
  req: Request,
  ctxParams: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctxParams.params;
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404, headers: cors(req) });
    }

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') ?? undefined;
    const cache = await getCache();
    const post = await getPublishedPostBySlugCached(prisma as never, cache, {
      siteId: site.id,
      slug,
      locale,
    });
    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: cors(req) });
    }

    return NextResponse.json(post, { headers: cors(req) });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400, headers: cors(req) });
  }
}
