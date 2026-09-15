import { NextResponse } from 'next/server';
import { listAudit } from '@varka/security';

async function getCtx() {
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: ['audit.read', 'security.read'],
  };
}

export async function GET(req: Request) {
  try {
    const ctx = await getCtx();
    if (!ctx.permissions.includes('audit.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const result = await listAudit(prisma as never, {
      siteId: site?.id,
      limit,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
