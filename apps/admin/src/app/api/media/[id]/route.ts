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
    permissions: ['media.read', 'media.upload', 'media.update', 'media.delete'],
  };
}

export async function PATCH(
  req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctxParams.params;
    const body = (await req.json()) as { alt?: string; title?: string; folder?: string };
    const { prisma } = await import('@varka/database');
    const ctx = await getCtx();
    const asset = await updateMediaMeta(prisma as never, ctx, id, body);
    return NextResponse.json(asset);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctxParams.params;
    const { prisma } = await import('@varka/database');
    const ctx = await getCtx();
    const storage = createStorageAdapterFromEnv();
    const result = await deleteMedia(prisma as never, storage, ctx, id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
