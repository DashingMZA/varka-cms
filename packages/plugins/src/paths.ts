import path from 'node:path';

/**
 * Where installed plugins live on disk.
 * - Local/dev & VPS: <repo>/apps/admin/plugins (override with PLUGIN_DIR)
 * - Vercel: ephemeral — uploads work but don't survive redeploys.
 */
export function resolvePluginDir(): string {
  const fromEnv = process.env.PLUGIN_DIR;
  if (fromEnv) return path.resolve(fromEnv);
  // Default: <repo>/apps/admin/plugins — resolved from the admin app cwd.
  // packages/plugins is imported by apps/admin, whose cwd is apps/admin.
  return path.resolve(process.cwd(), 'plugins');
}

export function pluginPath(slug: string): string {
  return path.join(resolvePluginDir(), slug);
}

export function pluginManifestPath(slug: string): string {
  return path.join(pluginPath(slug), 'plugin.json');
}
