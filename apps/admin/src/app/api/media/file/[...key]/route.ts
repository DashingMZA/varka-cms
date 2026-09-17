import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { resolveStorageDriver } from '@varka/media';

/**
 * Serve local-storage objects with strong browser caching.
 * Path traversal protected.
 */
export async function GET(
  req: Request,
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

    const st = await stat(full);
    const buf = await readFile(full);
    const etag = `"${createHash('sha1').update(buf).digest('hex')}"`;

    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

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
        'Content-Length': String(st.size),
        ETag: etag,
        // Content-addressed-ish keys (YYYY/MM/hash-name) → long cache
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
