import { NextResponse } from 'next/server';
import {
  createStorageAdapterFromEnv,
  deleteMedia,
  updateMediaMeta,
} from '@varka/media';

async function getCtx() {
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: ['media.read', 'media.update', 'media.delete'],
  };
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { prisma } = await import('@varka/database');
    const auth = await getCtx();
    const body = (await req.json()) as {
      alt?: string | null;
      title?: string | null;
      caption?: string | null;
      keywords?: string | null;
      folder?: string;
    };
    const asset = await updateMediaMeta(prisma as never, auth, id, body);
    return NextResponse.json(asset);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { prisma } = await import('@varka/database');
    const auth = await getCtx();
    const storage = createStorageAdapterFromEnv();
    const result = await deleteMedia(prisma as never, storage, auth, id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
