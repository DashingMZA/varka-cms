import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveStorageDriver } from '@varka/media';

/**
 * Serve local-storage objects. S3/R2 should use public CDN URL instead.
 * Path traversal protected.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> },
) {
  try {
    if (resolveStorageDriver() !== 'local') {
      return NextResponse.json(
        { error: 'File proxy only available for STORAGE_DRIVER=local' },
        { status: 400 },
      );
    }
    const { key: parts } = await ctx.params;
    const key = parts.join('/');
    const root = path.resolve(process.env.LOCAL_STORAGE_PATH ?? '.storage');
    const normalized = key.replace(/^\/+/, '').replace(/\.\./g, '');
    const full = path.resolve(root, normalized);
    if (!full.startsWith(root)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    const buf = await readFile(full);
    const ext = path.extname(full).toLowerCase();
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
    };
    const contentType = types[ext] ?? 'application/octet-stream';
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
