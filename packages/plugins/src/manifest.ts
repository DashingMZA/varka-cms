import { z } from 'zod';

/**
 * plugin.json manifest — WordPress-style plugin header as structured data.
 *
 * A plugin ZIP must contain plugin.json at its root (or inside a single
 * top-level folder) plus the compiled admin entry referenced below.
 */
export const pluginManifestSchema = z.object({
  /** URL-safe unique id, e.g. "wordpress-import" */
  slug: z
    .string()
    .regex(/^[a-z0-9-]{2,64}$/, 'slug must be 2-64 chars: a-z, 0-9, hyphen'),
  name: z.string().min(1).max(100),
  /** semver-ish, e.g. "1.0.0" */
  version: z.string().regex(/^\d+\.\d+\.\d+/, 'version must look like 1.0.0'),
  description: z.string().max(500).optional(),
  author: z.string().max(100).optional(),
  license: z.string().max(50).optional(),
  /** informational varka version constraint, e.g. ">=1.0.0" */
  varka: z.string().max(30).optional(),
  /**
   * When true, the plugin is automatically activated on install if no DB row
   * exists yet. Useful for bundled plugins.
   */
  autoActivate: z.boolean().optional(),
  admin: z.object({
    /** label shown in the admin menu */
    menuTitle: z.string().min(1).max(50),
    /** single emoji/char icon for the menu */
    menuIcon: z.string().max(10).optional(),
    /**
     * Path (relative to the plugin root) of the compiled ESM admin module.
     * Must default-export a React Server Component:
     *   export default async function AdminPage() { return <div/> }
     * May also export GET/POST/PUT/DELETE route handlers, served at
     * /api/plugins/<slug>/[...path].
     */
    entry: z.string().min(1).max(200),
  }),
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;

/** Result of validating a candidate plugin.json file. */
export function parseManifest(
  data: unknown,
): { ok: true; manifest: PluginManifest } | { ok: false; error: string } {
  const r = pluginManifestSchema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    return {
      ok: false,
      error: `Invalid plugin.json: ${first?.path.join('.') || 'root'} — ${first?.message}`,
    };
  }
  return { ok: true, manifest: r.data };
}
