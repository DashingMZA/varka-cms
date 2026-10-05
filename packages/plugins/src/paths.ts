import path from 'node:path';

/**
 * Where installed plugins live on disk.
 * - Local/dev & VPS: <repo>/apps/admin/plugins (override with PLUGIN_DIR)
 * - Vercel: ephemeral — uploads work but don't survive redeploys.
 *
 * turbopackIgnore: these are RUNTIME paths resolved from cwd/env — not static
 * asset dependencies. Without the ignore comments Turbopack traces the whole
 * project into the server bundle (deployment size blowup).
 */
export function resolvePluginDir(): string {
  const fromEnv = process.env.PLUGIN_DIR;
  // turbopackIgnore: runtime plugin dir from env — not a static asset dependency
  if (fromEnv) return path.resolve(/*turbopackIgnore: true*/ fromEnv);
  // Default: <repo>/apps/admin/plugins — resolved from the admin app cwd.
  // packages/plugins is imported by apps/admin, whose cwd is apps/admin.
  // turbopackIgnore: runtime cwd — not a static asset dependency
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'plugins');
}

export function pluginPath(slug: string): string {
  // turbopackIgnore: runtime plugin path — not a static asset dependency
  return path.join(/*turbopackIgnore: true*/ resolvePluginDir(), slug);
}

export function pluginManifestPath(slug: string): string {
  // turbopackIgnore: runtime plugin path — not a static asset dependency
  return path.join(/*turbopackIgnore: true*/ pluginPath(slug), 'plugin.json');
}
