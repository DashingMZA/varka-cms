import { NextResponse } from 'next/server';
import { listThemes, isThemeId, DEFAULT_THEME_ID } from '@varka/themes';
import { requirePermission } from '@varka/permissions';
import { getAuthContext } from '@/lib/auth-context';

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    requirePermission(ctx, 'themes.read');

    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    let active = DEFAULT_THEME_ID;
    if (site) {
      const setting = await prisma.siteSetting.findUnique({
        where: { siteId_key: { siteId: site.id, key: 'theme.active' } },
      });
      if (setting && typeof setting.value === 'string') active = setting.value;
      else if (
        setting &&
        setting.value &&
        typeof setting.value === 'object' &&
        'id' in (setting.value as object)
      ) {
        active = String((setting.value as { id: string }).id);
      }
    }
    const themes = listThemes().map((t) => ({
      ...t.manifest,
      active: t.manifest.id === active,
    }));
    return NextResponse.json({ themes, active });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    const status =
      message === 'Unauthorized' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    requirePermission(ctx, 'themes.activate');

    const body = (await req.json()) as { themeId?: string };
    if (!body.themeId || !isThemeId(body.themeId)) {
      return NextResponse.json({ error: 'Invalid themeId' }, { status: 400 });
    }
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    await prisma.siteSetting.upsert({
      where: { siteId_key: { siteId: site.id, key: 'theme.active' } },
      update: { value: body.themeId },
      create: { siteId: site.id, key: 'theme.active', value: body.themeId },
    });

    return NextResponse.json({ ok: true, active: body.themeId });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    const status =
      message === 'Unauthorized' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
