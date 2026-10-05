import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { parseManifest, type PluginManifest } from './manifest';
import { pluginManifestPath, resolvePluginDir } from './paths';

export type DiscoveredPlugin = {
  slug: string;
  manifest: PluginManifest;
  dir: string;
};

/** Read and validate the manifest of one installed plugin directory. */
export async function readInstalledManifest(
  slug: string,
): Promise<PluginManifest | null> {
  try {
    const raw = await readFile(pluginManifestPath(slug), 'utf8');
    const parsed = parseManifest(JSON.parse(raw));
    if (!parsed.ok) return null;
    // Manifest slug must match directory name (prevents confusion attacks).
    if (parsed.manifest.slug !== slug) return null;
    return parsed.manifest;
  } catch {
    return null;
  }
}

/**
 * List every valid installed plugin by scanning the plugin directory.
 * Invalid directories (no/invalid plugin.json) are skipped.
 */
export async function discoverInstalledPlugins(): Promise<DiscoveredPlugin[]> {
  const dir = resolvePluginDir();
  if (!existsSync(dir)) return [];
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  const out: DiscoveredPlugin[] = [];
  for (const slug of entries) {
    if (slug.startsWith('.')) continue;
    const manifest = await readInstalledManifest(slug);
    if (!manifest) continue;
    out.push({
      slug,
      manifest,
      dir: `${dir}/${slug}`.replace(/\/+/g, '/'),
    });
  }
  out.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  return out;
}
