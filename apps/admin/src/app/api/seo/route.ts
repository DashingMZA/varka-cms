import { NextResponse } from 'next/server';
import { requirePermission } from '@varka/permissions';
import { writeAudit } from '@varka/security';
import { clientIp } from '@varka/cache';
import { getAuthContext } from '@/lib/auth-context';

function errStatus(message: string): number {
  if (message === 'Unauthorized' || message.includes('Unauthorized')) return 401;
  if (message.includes('Forbidden') || message.includes('permission')) return 403;
  return 400;
}

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    requirePermission(ctx, 'seo.read');

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
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    requirePermission(ctx, 'seo.update');

    const body = (await req.json()) as Record<string, unknown>;
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    const keys: string[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (!key.startsWith('seo.')) continue;
      keys.push(key);
      await prisma.siteSetting.upsert({
        where: { siteId_key: { siteId: site.id, key } },
        update: { value: value as never },
        create: { siteId: site.id, key, value: value as never },
      });
    }

    void writeAudit(prisma as never, {
      siteId: site.id,
      actorId: ctx.userId === 'dev-user' ? undefined : ctx.userId,
      action: 'seo.update',
      entityType: 'SiteSetting',
      entityId: site.id,
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent'),
      meta: { keys },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}
