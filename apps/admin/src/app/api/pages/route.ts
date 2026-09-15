import { NextResponse } from 'next/server';
import { listPages, createPage } from '@varka/content';
import { getAuthContext } from '@/lib/auth-context';

async function siteId(prisma: {
  site: { findFirst: (a: unknown) => Promise<{ id: string } | null> };
}) {
  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found — run seed');
  return site.id;
}

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const { prisma } = await import('@varka/database');
    const id = await siteId(prisma as never);
    const result = await listPages(prisma as never, ctx, { siteId: id });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    const status = message === 'Unauthorized' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const body = (await req.json()) as { title?: string; contentHtml?: string; slug?: string };
    if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    const { prisma } = await import('@varka/database');
    const id = await siteId(prisma as never);
    const page = await createPage(prisma as never, ctx, {
      siteId: id,
      title: body.title,
      slug: body.slug,
      contentHtml: body.contentHtml ?? '',
    });
    return NextResponse.json(page, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    const status = message === 'Unauthorized' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
