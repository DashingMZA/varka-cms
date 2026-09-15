import { NextResponse } from 'next/server';
import { listThemes, isThemeId, DEFAULT_THEME_ID } from '@varka/themes';

async function getCtx() {
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: ['themes.read', 'themes.activate', 'themes.customize', 'settings.update'],
  };
}

export async function GET() {
  try {
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    let active = DEFAULT_THEME_ID;
    if (site) {
      const setting = await prisma.siteSetting.findUnique({
        where: { siteId_key: { siteId: site.id, key: 'theme.active' } },
      });
      if (setting && typeof setting.value === 'string') active = setting.value;
      else if (setting && setting.value && typeof setting.value === 'object' && 'id' in (setting.value as object)) {
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
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getCtx();
    if (!ctx.permissions.includes('themes.activate')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
