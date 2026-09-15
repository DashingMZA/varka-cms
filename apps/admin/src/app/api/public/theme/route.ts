import { NextResponse } from 'next/server';
import { DEFAULT_THEME_ID, getTheme, getThemeCss, isThemeId } from '@varka/themes';

/** Public active theme + CSS for Astro / CDN. */
export async function GET() {
  try {
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    let active = DEFAULT_THEME_ID;
    if (site) {
      const setting = await prisma.siteSetting.findUnique({
        where: { siteId_key: { siteId: site.id, key: 'theme.active' } },
      });
      if (setting && typeof setting.value === 'string' && isThemeId(setting.value)) {
        active = setting.value;
      }
    }
    const mod = getTheme(active);
    const css = await getThemeCss(active);
    return NextResponse.json(
      {
        id: active,
        manifest: mod.manifest,
        css,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
