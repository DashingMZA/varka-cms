import { notFound } from 'next/navigation';
import { prisma } from '@/lib/server-db';
import { pluginPath } from '@varka/plugins';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PluginManifest } from '@varka/plugins';

/**
 * Renders an active plugin's admin page.
 * The plugin's compiled ESM entry must default-export a React Server
 * Component. Loaded at request time so ZIP-installed plugins work without
 * a rebuild.
 */
async function loadPluginAdmin(slug: string): Promise<{
  manifest: PluginManifest;
  Page: React.ComponentType<Record<string, unknown>>;
} | null> {
  if (!/^[a-z0-9-]{2,64}$/.test(slug)) return null;

  const dir = pluginPath(slug);
  let manifest: PluginManifest;
  try {
    manifest = JSON.parse(await readFile(path.join(/*turbopackIgnore: true*/ dir, 'plugin.json'), 'utf8'));
  } catch {
    return null;
  }
  if (manifest.slug !== slug) return null;

  // Auto-activate bundled plugins (manifest autoActivate) that have no DB row yet.
  // This ensures /plugins/[slug] works even if the list page was never visited.
  let row = await prisma.plugin.findUnique({ where: { slug } }).catch(() => null);
  if (!row && manifest.autoActivate) {
    try {
      row = await prisma.plugin.create({
        data: {
          slug,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description ?? null,
          author: manifest.author ?? null,
          active: true,
          manifest: JSON.parse(JSON.stringify(manifest)),
        },
      });
    } catch {
      /* ignore — will 404 below if still inactive */
    }
  }
  if (!row?.active) return null;

  const entryAbs = path.join(/*turbopackIgnore: true*/ dir, manifest.admin.entry);
  let mod: { default?: React.ComponentType<Record<string, unknown>> };
  try {
    // webpackIgnore: runtime plugin path — must not be bundled at build time.
    mod = await import(/* webpackIgnore: true */ entryAbs);
  } catch {
    return null;
  }
  if (typeof mod.default !== 'function') return null;
  return { manifest, Page: mod.default };
}

export default async function PluginAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loaded = await loadPluginAdmin(slug);
  if (!loaded) notFound();
  const { manifest, Page } = loaded;
  return (
    <main className="v-plugin-page">
      <h1 className="v-admin-title">{manifest.admin.menuTitle}</h1>
      <Page />
    </main>
  );
}
