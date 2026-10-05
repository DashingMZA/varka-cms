import { ThemePicker } from '@/components/theme-picker';
import { listThemes, DEFAULT_THEME_ID } from '@varka/themes';

/** Server Component: load themes on the server for instant render (no client fetch delay). */
export default async function AppearanceThemesPage() {
  const { prisma } = await import('@varka/database');

  let active = DEFAULT_THEME_ID;
  try {
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (site) {
      const setting = await prisma.siteSetting.findUnique({
        where: { siteId_key: { siteId: site.id, key: 'theme.active' } },
      });
      if (setting && typeof setting.value === 'string') active = setting.value;
      else if (setting?.value && typeof setting.value === 'object' && 'id' in (setting.value as object)) {
        active = String((setting.value as { id: string }).id);
      }
    }
  } catch {
    /* use default */
  }

  const themes = listThemes().map((t) => ({
    id: t.manifest.id,
    name: t.manifest.name,
    description: t.manifest.description,
    version: (t.manifest as { version?: string }).version,
    author: (t.manifest as { author?: string }).author,
    tokens: t.manifest.tokens,
    active: t.manifest.id === active,
  }));

  return (
    <main>
      <ThemePicker initialThemes={themes} />
    </main>
  );
}
