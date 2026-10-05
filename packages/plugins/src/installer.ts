import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseManifest, type PluginManifest } from './manifest';
import { pluginPath, resolvePluginDir } from './paths';

const require = createRequire(import.meta.url);
// adm-zip has no ESM types bundled; loaded lazily so the package stays
// importable in edge runtimes that never install plugins.
type AdmZip = {
  new (buffer: Buffer): {
    getEntries(): Array<{
      entryName: string;
      isDirectory: boolean;
      getData(): Buffer;
    }>;
  };
};
function loadAdmZip(): AdmZip {
  return require('adm-zip') as AdmZip;
}

export type InstallResult =
  | { ok: true; manifest: PluginManifest; replaced: boolean }
  | { ok: false; error: string };

const MAX_ZIP_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_FILES = 2000;

/**
 * Install (or upgrade) a plugin from a ZIP buffer — the WordPress-style flow.
 *
 * Layout accepted:
 *   plugin.json at ZIP root, or inside a single top-level folder
 *   (e.g. wordpress-import/plugin.json + wordpress-import/dist/admin.js).
 *
 * Safety:
 * - rejects zip-slip paths (.., absolute, drive letters)
 * - caps file count and total size
 * - validates plugin.json before touching the live plugin dir
 * - extracts to a temp dir, then atomically renames into place
 */
export async function installPluginFromZip(
  zipBuffer: Buffer,
  opts?: { allowReplace?: boolean },
): Promise<InstallResult> {
  if (!Buffer.isBuffer(zipBuffer) || zipBuffer.length === 0) {
    return { ok: false, error: 'Empty file.' };
  }
  if (zipBuffer.length > MAX_ZIP_BYTES) {
    return { ok: false, error: 'ZIP is larger than 50 MB.' };
  }

  let zip: InstanceType<AdmZip>;
  try {
    zip = new (loadAdmZip())(zipBuffer);
  } catch {
    return { ok: false, error: 'Not a valid ZIP file.' };
  }

  type ZipEntry = ReturnType<InstanceType<AdmZip>['getEntries']>[number];
  const entries = zip.getEntries().filter((e: ZipEntry) => !e.isDirectory);
  if (entries.length === 0) return { ok: false, error: 'ZIP is empty.' };
  if (entries.length > MAX_FILES) {
    return { ok: false, error: `ZIP has too many files (${entries.length}).` };
  }

  // Find plugin.json — at root or one level deep.
  const manifestEntry = entries.find(
    (e: ZipEntry) => e.entryName === 'plugin.json' || /^[^/]+\/plugin\.json$/.test(e.entryName),
  );
  if (!manifestEntry) {
    return { ok: false, error: 'plugin.json not found in the ZIP.' };
  }
  const prefix = manifestEntry.entryName.includes('/')
    ? manifestEntry.entryName.slice(0, manifestEntry.entryName.indexOf('/') + 1)
    : '';

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(manifestEntry.getData().toString('utf8'));
  } catch {
    return { ok: false, error: 'plugin.json is not valid JSON.' };
  }
  const parsed = parseManifest(manifestJson);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const { manifest } = parsed;

  const destDir = pluginPath(manifest.slug);
  const replaced = existsSync(destDir);
  if (replaced && opts?.allowReplace === false) {
    return {
      ok: false,
      error: `Plugin "${manifest.slug}" is already installed.`,
    };
  }

  // Validate every path before writing anything (zip-slip protection).
  const files: Array<{ rel: string; data: Buffer }> = [];
  for (const e of entries) {
    if (prefix && !e.entryName.startsWith(prefix)) continue;
    const rel = prefix ? e.entryName.slice(prefix.length) : e.entryName;
    if (!rel || rel.endsWith('/')) continue;
    if (
      rel.includes('..') ||
      path.isAbsolute(rel) ||
      /^[a-zA-Z]:/.test(rel) ||
      rel.includes('\0')
    ) {
      return { ok: false, error: `Unsafe path in ZIP: ${e.entryName}` };
    }
    files.push({ rel, data: e.getData() });
  }

  // The compiled admin entry must exist.
  if (!files.some((f) => f.rel === manifest.admin.entry)) {
    return {
      ok: false,
      error: `Admin entry "${manifest.admin.entry}" not found in the ZIP.`,
    };
  }

  // Extract to temp, then atomic rename.
  // turbopackIgnore: runtime install paths — not static asset dependencies
  const tmpDir = path.join(
    /*turbopackIgnore: true*/ resolvePluginDir(),
    `.tmp-install-${manifest.slug}-${Date.now()}`,
  );
  try {
    await mkdir(tmpDir, { recursive: true });
    for (const f of files) {
      // turbopackIgnore: runtime install path — not a static asset dependency
      const full = path.join(/*turbopackIgnore: true*/ tmpDir, f.rel);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, f.data);
    }
    await mkdir(resolvePluginDir(), { recursive: true });
    if (replaced) await rm(destDir, { recursive: true, force: true });
    await mkdir(path.dirname(destDir), { recursive: true });
    // rename across the temp dir is atomic on the same filesystem
    const { rename } = await import('node:fs/promises');
    await rename(tmpDir, destDir);
  } catch (e) {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    return {
      ok: false,
      error: `Install failed: ${e instanceof Error ? e.message : 'unknown error'}`,
    };
  }

  return { ok: true, manifest, replaced };
}

/** Remove an installed plugin's files entirely. */
export async function uninstallPluginFiles(slug: string): Promise<void> {
  if (!/^[a-z0-9-]{2,64}$/.test(slug)) throw new Error('Invalid slug');
  await rm(pluginPath(slug), { recursive: true, force: true });
}
