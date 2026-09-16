import { NextResponse } from 'next/server';
import { getPost, updatePost, trashPost, invalidatePostCache } from '@varka/content';
import { getCache } from '@varka/cache';
import { getAuthContext } from '@/lib/auth-context';

function statusFromError(message: string): number {
  if (message === 'Unauthorized' || message.includes('Unauthorized')) return 401;
  if (message.includes('Forbidden') || message.includes('permission')) return 403;
  if (message.includes('not found') || message.includes('Not found')) return 404;
  if (message.includes('Stale')) return 409;
  return 400;
}

type PostCacheShape = {
  siteId?: string;
  translations?: Array<{ slug: string; languageId?: string; language?: { locale?: string } }>;
};

async function bustPostCache(post: unknown) {
  try {
    const cache = await getCache();
    const p = post as PostCacheShape;
    const siteId = p.siteId;
    const tr = p.translations?.[0];
    if (siteId) {
      await invalidatePostCache(cache, {
        siteId,
        slug: tr?.slug,
        locale: tr?.language?.locale,
      });
    }
  } catch {
    /* non-blocking */
  }
}

export async function GET(req: Request, ctxParams: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctxParams.params;
    const ctx = await getAuthContext(req);
    const { prisma } = await import('@varka/database');
    const post = await getPost(prisma as never, ctx, id);
    return NextResponse.json(post);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: statusFromError(message) });
  }
}

export async function PATCH(req: Request, ctxParams: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctxParams.params;
    const body = await req.json();
    const ctx = await getAuthContext(req);
    const { prisma } = await import('@varka/database');
    const post = await updatePost(prisma as never, ctx, id, body);
    await bustPostCache(post);
    return NextResponse.json(post);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: statusFromError(message) });
  }
}

export async function DELETE(req: Request, ctxParams: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctxParams.params;
    const body = (await req.json().catch(() => ({}))) as { languageId?: string; version?: number };
    const ctx = await getAuthContext(req);
    const { prisma } = await import('@varka/database');

    const existing = (await prisma.post.findUnique({
      where: { id },
      include: { translations: { include: { language: true } } },
    })) as PostCacheShape & {
      translations: Array<{ languageId: string; slug: string; language?: { locale?: string } }>;
    } | null;

    let languageId = body.languageId;
    if (!languageId) {
      languageId = existing?.translations?.[0]?.languageId;
    }
    if (!languageId) {
      return NextResponse.json({ error: 'languageId required' }, { status: 400 });
    }

    const post = await trashPost(prisma as never, ctx, id, languageId);
    await bustPostCache({
      siteId: existing?.siteId,
      translations: existing?.translations,
    });
    return NextResponse.json({ ok: true, post });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: statusFromError(message) });
  }
}
