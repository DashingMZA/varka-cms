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
 *
 * Cached in memory for 30s — the scan reads every manifest from disk, and
 * the admin layout calls this on every request for the sidebar plugin menu.
 * Plugin install/activate/deactivate flows should call
 * `invalidatePluginDiscoveryCache()` after changing the plugin directory.
 */
let discoveryCache: { at: number; plugins: DiscoveredPlugin[] } | null = null;
const DISCOVERY_TTL_MS = 30_000;

export function invalidatePluginDiscoveryCache(): void {
  discoveryCache = null;
}

export async function discoverInstalledPlugins(): Promise<DiscoveredPlugin[]> {
  if (discoveryCache && Date.now() - discoveryCache.at < DISCOVERY_TTL_MS) {
    return discoveryCache.plugins;
  }
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
  discoveryCache = { at: Date.now(), plugins: out };
  return out;
}
