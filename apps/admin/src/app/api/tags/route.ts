import { NextResponse } from 'next/server';
import { prisma } from '@varka/database';

async function siteId() {
  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found');
  return site.id;
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'tag'
  );
}

export async function GET() {
  try {
    const sid = await siteId();
    const items = await prisma.tag.findMany({
      where: { siteId: sid },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error' },
      { status: 400 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string };
    const name = (body.name ?? '').trim();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const sid = await siteId();
    const lang = await prisma.language.findFirst({
      where: { siteId: sid, defaultLanguage: true },
    });
    if (!lang) return NextResponse.json({ error: 'No default language' }, { status: 400 });
    const slug = slugify(name);
    const tag = await prisma.tag.create({
      data: {
        siteId: sid,
        translations: {
          create: { languageId: lang.id, name, slug },
        },
      },
      include: { translations: true, _count: { select: { posts: true } } },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error' },
      { status: 400 },
    );
  }
}
