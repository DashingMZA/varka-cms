import { NextResponse } from 'next/server';
import { requirePermission } from '@varka/permissions';
import { getAuthContext } from '@/lib/auth-context';

function errStatus(message: string): number {
  if (message === 'Unauthorized' || message.includes('Unauthorized')) return 401;
  if (message.includes('Forbidden') || message.includes('permission')) return 403;
  return 400;
}

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    requirePermission(ctx, 'languages.read');

    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    const items = await prisma.language.findMany({
      where: { siteId: site.id },
      orderBy: [{ displayOrder: 'asc' }, { locale: 'asc' }],
    });
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    requirePermission(ctx, 'languages.manage');

    const body = (await req.json()) as {
      name?: string;
      nativeName?: string;
      locale?: string;
      languageCode?: string;
      script?: string;
      direction?: string;
      urlPrefix?: string;
      enabled?: boolean;
      defaultLanguage?: boolean;
    };

    if (!body.name || !body.locale || !body.languageCode || !body.script) {
      return NextResponse.json(
        { error: 'name, locale, languageCode, script required' },
        { status: 400 },
      );
    }

    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    if (body.defaultLanguage) {
      await prisma.language.updateMany({
        where: { siteId: site.id },
        data: { defaultLanguage: false },
      });
    }

    const lang = await prisma.language.create({
      data: {
        siteId: site.id,
        name: body.name,
        nativeName: body.nativeName ?? body.name,
        locale: body.locale,
        languageCode: body.languageCode,
        script: body.script,
        direction: body.direction ?? 'ltr',
        urlPrefix: body.urlPrefix ?? (body.defaultLanguage ? '' : body.locale),
        enabled: body.enabled ?? true,
        defaultLanguage: body.defaultLanguage ?? false,
        displayOrder: 10,
      },
    });
    return NextResponse.json(lang, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}
