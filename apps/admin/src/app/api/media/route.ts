import { NextResponse } from 'next/server';
import {
  createStorageAdapterFromEnv,
  listMedia,
  uploadMedia,
  sniffMime,
} from '@varka/media';
import { getAuthContext } from '@/lib/auth-context';

function errStatus(message: string): number {
  if (message === 'Unauthorized' || message.includes('Unauthorized')) return 401;
  if (message.includes('Forbidden') || message.includes('permission')) return 403;
  return 400;
}

async function getSiteId(db: {
  site: { findFirst: (a: unknown) => Promise<{ id: string } | null> };
}) {
  const site = await db.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found');
  return site.id;
}

export async function GET(req: Request) {
  try {
    const { prisma } = await import('@varka/database');
    const ctx = await getAuthContext(req);
    const siteId = await getSiteId(prisma as never);
    const url = new URL(req.url);
    const folder = url.searchParams.get('folder') ?? undefined;
    const result = await listMedia(prisma as never, ctx, { siteId, folder });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}

export async function POST(req: Request) {
  try {
    const { prisma } = await import('@varka/database');
    const ctx = await getAuthContext(req);
    const siteId = await getSiteId(prisma as never);
    const storage = createStorageAdapterFromEnv();

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const alt = String(form.get('alt') ?? '') || undefined;
    const title = String(form.get('title') ?? '') || undefined;
    const folder = String(form.get('folder') ?? '/') || '/';
    const mimeType = sniffMime(file.type, file.name);

    const result = await uploadMedia(
      prisma as never,
      storage,
      ctx,
      {
        siteId,
        filename: file.name || 'upload.bin',
        mimeType,
        alt,
        title,
        folder,
      },
      buf,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}
