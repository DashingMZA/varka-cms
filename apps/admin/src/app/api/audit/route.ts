import { NextResponse } from 'next/server';
import { listAudit } from '@varka/security';
import { requirePermission } from '@varka/permissions';
import { getAuthContext } from '@/lib/auth-context';

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    requirePermission(ctx, 'audit.read');

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
    const status =
      message === 'Unauthorized' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
