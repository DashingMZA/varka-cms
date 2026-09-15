import { mkdir, writeFile, unlink, access } from 'node:fs/promises';
import path from 'node:path';
import type { PutObjectInput, PutObjectResult, StorageAdapter } from './types';

export type LocalAdapterOptions = {
  /** Absolute or project-relative root for files */
  rootDir: string;
  /** URL prefix used by admin/public to fetch files, e.g. /media */
  publicBaseUrl: string;
};

export function createLocalAdapter(opts: LocalAdapterOptions): StorageAdapter {
  const root = path.resolve(opts.rootDir);
  const base = opts.publicBaseUrl.replace(/\/$/, '');

  function resolveKey(key: string): string {
    const normalized = key.replace(/^\/+/, '').replace(/\.\./g, '');
    const full = path.resolve(root, normalized);
    if (!full.startsWith(root)) {
      throw new Error('Invalid key path');
    }
    return full;
  }

  return {
    name: 'local',
    async put(input: PutObjectInput): Promise<PutObjectResult> {
      const full = resolveKey(input.key);
      await mkdir(path.dirname(full), { recursive: true });
      const buf = Buffer.isBuffer(input.body) ? input.body : Buffer.from(input.body);
      await writeFile(full, buf);
      return { key: input.key.replace(/^\/+/, ''), sizeBytes: buf.length };
    },
    async delete(key: string): Promise<void> {
      const full = resolveKey(key);
      try {
        await access(full);
        await unlink(full);
      } catch {
        // already gone
      }
    },
    getUrl(key: string): string {
      return `${base}/${key.replace(/^\/+/, '')}`;
    },
  };
}
