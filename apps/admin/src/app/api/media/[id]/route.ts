import { NextResponse } from 'next/server';
import {
  createStorageAdapterFromEnv,
  deleteMedia,
  updateMediaMeta,
} from '@varka/media';
import { getAuthContext } from '@/lib/auth-context';

function errStatus(message: string): number {
  if (message === 'Unauthorized' || message.includes('Unauthorized')) return 401;
  if (message.includes('Forbidden') || message.includes('permission')) return 403;
  if (message.includes('Not found')) return 404;
  return 400;
}

export async function PATCH(
  req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctxParams.params;
    const body = (await req.json()) as { alt?: string; title?: string; folder?: string };
    const { prisma } = await import('@varka/database');
    const ctx = await getAuthContext(req);
    const asset = await updateMediaMeta(prisma as never, ctx, id, body);
    return NextResponse.json(asset);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}

export async function DELETE(
  req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctxParams.params;
    const { prisma } = await import('@varka/database');
    const ctx = await getAuthContext(req);
    const storage = createStorageAdapterFromEnv();
    const result = await deleteMedia(prisma as never, storage, ctx, id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}
