import { NextResponse } from 'next/server';

async function getCtx() {
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: ['seo.read', 'seo.update', 'settings.update'],
  };
}

export async function GET() {
  try {
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const rows = await prisma.siteSetting.findMany({
      where: { siteId: site.id, key: { startsWith: 'seo.' } },
    });
    const settings: Record<string, unknown> = {};
    for (const r of rows) settings[r.key] = r.value;
    return NextResponse.json({
      siteId: site.id,
      defaults: {
        'seo.titleTemplate': '%s · VARKA',
        'seo.defaultDescription': 'Editorial publishing with VARKA',
        'seo.robotsIndex': true,
      },
      settings,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getCtx();
    if (!ctx.permissions.includes('seo.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = (await req.json()) as Record<string, unknown>;
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    for (const [key, value] of Object.entries(body)) {
      if (!key.startsWith('seo.')) continue;
      await prisma.siteSetting.upsert({
        where: { siteId_key: { siteId: site.id, key } },
        update: { value: value as object },
        create: { siteId: site.id, key, value: value as object },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
