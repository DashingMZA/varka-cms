import { NextResponse } from 'next/server';
import { requirePermission } from '@varka/permissions';
import { getAuthContext } from '@/lib/auth-context';

function errStatus(message: string): number {
  if (message === 'Unauthorized' || message.includes('Unauthorized')) return 401;
  if (message.includes('Forbidden') || message.includes('permission')) return 403;
  return 400;
}

export async function PATCH(
  req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctxParams.params;
    const ctx = await getAuthContext(req);
    requirePermission(ctx, 'languages.manage');

    const body = (await req.json()) as {
      enabled?: boolean;
      urlPrefix?: string;
      displayOrder?: number;
      name?: string;
      nativeName?: string;
      defaultLanguage?: boolean;
    };

    const { prisma } = await import('@varka/database');
    const existing = await prisma.language.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (body.defaultLanguage) {
      await prisma.language.updateMany({
        where: { siteId: existing.siteId },
        data: { defaultLanguage: false },
      });
    }

    const lang = await prisma.language.update({
      where: { id },
      data: {
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.urlPrefix !== undefined ? { urlPrefix: body.urlPrefix } : {}),
        ...(body.displayOrder !== undefined ? { displayOrder: body.displayOrder } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.nativeName !== undefined ? { nativeName: body.nativeName } : {}),
        ...(body.defaultLanguage !== undefined ? { defaultLanguage: body.defaultLanguage } : {}),
      },
    });
    return NextResponse.json(lang);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}
