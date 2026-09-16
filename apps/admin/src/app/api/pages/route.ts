import { NextResponse } from 'next/server';
import { listPages, createPage } from '@varka/content';

async function getCtx() {
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: [
      'pages.read',
      'pages.create',
      'pages.update',
      'pages.delete',
    ],
  };
}

async function siteId(db: {
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
    const sid = await siteId(prisma as never);
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? 100);
    const result = await listPages(prisma as never, ctx, {
      siteId: sid,
      status: status || undefined,
      limit,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { prisma } = await import('@varka/database');
    const ctx = await getCtx();
    const sid = await siteId(prisma as never);
    const body = (await req.json()) as {
      title?: string;
      slug?: string;
      contentHtml?: string;
      template?: string;
    };
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }
    const page = await createPage(prisma as never, ctx, {
      siteId: sid,
      title: body.title.trim(),
      slug: body.slug,
      contentHtml: body.contentHtml ?? '',
      template: body.template,
    });
    return NextResponse.json(page, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
