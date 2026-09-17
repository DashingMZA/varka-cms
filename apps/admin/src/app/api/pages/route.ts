import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';

async function getSiteId() {
  const { prisma } = await import('@varka/database');
  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found — run seed');
  return { prisma, siteId: site.id };
}

export async function GET(req: Request) {
  try {
    await getAuthContext(req);
    const { prisma, siteId } = await getSiteId();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q')?.trim();
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 200);

    const items = await prisma.page.findMany({
      where: {
        siteId,
        ...(status && status !== 'all' ? { status: status as never } : {}),
        ...(q
          ? {
              translations: {
                some: {
                  OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { slug: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        translations: { take: 1, select: { title: true, slug: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    });

    const [all, published, draft, trashed] = await Promise.all([
      prisma.page.count({ where: { siteId } }),
      prisma.page.count({ where: { siteId, status: 'PUBLISHED' } }),
      prisma.page.count({ where: { siteId, status: 'DRAFT' } }),
      prisma.page.count({ where: { siteId, status: 'TRASHED' } }),
    ]);

    return NextResponse.json({
      items,
      counts: { all, published, draft, trashed },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const { prisma, siteId } = await getSiteId();
    const body = (await req.json()) as { title?: string };
    const title = (body.title ?? 'Untitled').trim() || 'Untitled';
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 120) || `page-${Date.now()}`;

    const lang = await prisma.language.findFirst({
      where: { siteId, isDefault: true },
    });
    if (!lang) throw new Error('Default language missing');

    const page = await prisma.page.create({
      data: {
        siteId,
        authorId: ctx.userId && ctx.userId !== 'dev-user' ? ctx.userId : undefined,
        status: 'DRAFT',
        translations: {
          create: {
            languageId: lang.id,
            title,
            slug: `${slug}-${Date.now().toString(36)}`,
            contentHtml: '',
          },
        },
      },
      include: { translations: true },
    });
    return NextResponse.json(page, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
