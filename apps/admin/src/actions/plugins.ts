'use server';

import {
  discoverInstalledPlugins,
  installPluginFromZip,
  uninstallPluginFiles,
} from '@varka/plugins';
import { prisma, requireServerAuth } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

export type PluginActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): PluginActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

export type PluginListItem = {
  slug: string;
  name: string;
  version: string;
  description: string | null;
  author: string | null;
  active: boolean;
  installedAt: string;
  menuTitle: string | null;
  hasFiles: boolean;
};

type PluginRow = {
  slug: string;
  name: string;
  version: string;
  description: string | null;
  author: string | null;
  active: boolean;
  installedAt: Date;
  manifest?: unknown;
};

/** All known plugins: DB rows merged with filesystem discovery. */
export async function listPluginsAction(): Promise<
  PluginActionResult<PluginListItem[]>
> {
  try {
    await requireServerAuth('plugins.read');
    const discovered = await discoverInstalledPlugins();
    // Plugin table may not exist yet (migration not run) — still show
    // discovered plugins so the user can initialize from the UI.
    let rows: PluginRow[] = [];
    try {
      rows = (await prisma.plugin.findMany({
        orderBy: { name: 'asc' },
      })) as PluginRow[];
    } catch {
      rows = [];
    }
    const bySlug = new Map(rows.map((r: PluginRow) => [r.slug, r]));
    // Auto-activate bundled plugins (manifest autoActivate) that have no DB row yet.
    for (const d of discovered) {
      if (!bySlug.has(d.slug) && d.manifest.autoActivate) {
        try {
          const created = await prisma.plugin.create({
            data: {
              slug: d.slug,
              name: d.manifest.name,
              version: d.manifest.version,
              description: d.manifest.description ?? null,
              author: d.manifest.author ?? null,
              active: true,
              manifest: JSON.parse(JSON.stringify(d.manifest)),
            },
          });
          bySlug.set(d.slug, created);
        } catch {
          // Table missing — will be picked up after "Initialize plugin system".
        }
      }
    }
    const items: PluginListItem[] = discovered.map((d) => {
      const row = bySlug.get(d.slug);
      bySlug.delete(d.slug);
      return {
        slug: d.slug,
        name: row?.name ?? d.manifest.name,
        version: row?.version ?? d.manifest.version,
        description: row?.description ?? d.manifest.description ?? null,
        author: row?.author ?? d.manifest.author ?? null,
        active: row?.active ?? false,
        installedAt: (row?.installedAt ?? new Date()).toISOString(),
        menuTitle: d.manifest.admin.menuTitle,
        hasFiles: true,
      };
    });
    // DB rows whose files vanished (e.g. ephemeral Vercel disk)
    for (const row of bySlug.values()) {
      items.push({
        slug: row.slug,
        name: row.name,
        version: row.version,
        description: row.description,
        author: row.author,
        active: false,
        installedAt: row.installedAt.toISOString(),
        menuTitle: null,
        hasFiles: false,
      });
    }
    return { ok: true, data: items };
  } catch (e) {
    return fail(e);
  }
}

/** Install (or upgrade) a plugin from an uploaded ZIP — WordPress-style. */
export async function installPluginAction(
  formData: FormData,
): Promise<PluginActionResult<{ slug: string; name: string; replaced: boolean }>> {
  try {
    await requireServerAuth('plugins.install');
    const file = formData.get('pluginZip');
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: 'Choose a plugin ZIP file first.' };
    }
    if (!/\.zip$/i.test(file.name)) {
      return { ok: false, error: 'Only .zip files can be installed.' };
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await installPluginFromZip(buf);
    if (!result.ok) return { ok: false, error: result.error };
    const { manifest, replaced } = result;

    await prisma.plugin.upsert({
      where: { slug: manifest.slug },
      create: {
        slug: manifest.slug,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description ?? null,
        author: manifest.author ?? null,
        active: manifest.autoActivate ?? false,
        manifest: JSON.parse(JSON.stringify(manifest)),
      },
      update: {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description ?? null,
        author: manifest.author ?? null,
        manifest: JSON.parse(JSON.stringify(manifest)),
      },
    });

    revalidatePath('/plugins');
    return { ok: true, data: { slug: manifest.slug, name: manifest.name, replaced } };
  } catch (e) {
    return fail(e);
  }
}

export async function activatePluginAction(
  slug: string,
): Promise<PluginActionResult<{ slug: string }>> {
  try {
    await requireServerAuth('plugins.activate');
    const row = await prisma.plugin.findUnique({ where: { slug } });
    if (!row) return { ok: false, error: 'Plugin not found.' };
    await prisma.plugin.update({ where: { slug }, data: { active: true } });
    revalidatePath('/plugins');
    return { ok: true, data: { slug } };
  } catch (e) {
    return fail(e);
  }
}

export async function deactivatePluginAction(
  slug: string,
): Promise<PluginActionResult<{ slug: string }>> {
  try {
    await requireServerAuth('plugins.activate');
    await prisma.plugin.update({ where: { slug }, data: { active: false } });
    revalidatePath('/plugins');
    return { ok: true, data: { slug } };
  } catch (e) {
    return fail(e);
  }
}

/** Delete plugin files + DB row. */
export async function deletePluginAction(
  slug: string,
): Promise<PluginActionResult<{ slug: string }>> {
  try {
    await requireServerAuth('plugins.delete');
    await uninstallPluginFiles(slug);
    await prisma.plugin.deleteMany({ where: { slug } });
    revalidatePath('/plugins');
    return { ok: true, data: { slug } };
  } catch (e) {
    return fail(e);
  }
}

/** Active plugins' menu entries for the admin nav. */
export async function getActivePluginMenuAction(): Promise<
  PluginActionResult<Array<{ slug: string; title: string; icon: string }>>
> {
  try {
    // Any authenticated admin user sees plugin menu entries.
    await requireServerAuth('plugins.read');
    const [rows, discovered] = await Promise.all([
      prisma.plugin.findMany({ where: { active: true } }) as Promise<PluginRow[]>,
      discoverInstalledPlugins(),
    ]);
    const manifests = new Map(discovered.map((d) => [d.slug, d.manifest]));
    const items = rows
      .map((r: PluginRow) => {
        const m = manifests.get(r.slug);
        if (!m) return null;
        return {
          slug: r.slug,
          title: m.admin.menuTitle,
          icon: m.admin.menuIcon ?? '🔌',
        };
      })
      .filter((x): x is { slug: string; title: string; icon: string } => x !== null);
    return { ok: true, data: items };
  } catch {
    return { ok: true, data: [] };
  }
}
