import { NextResponse } from 'next/server';
import { listCommentsForPost, submitComment } from '@varka/content';
import { CacheKeys, clientIp, getCache, rateLimit } from '@varka/cache';
import {
  allowedOriginsFromEnv,
  assertSameOrigin,
  OriginError,
  writeAudit,
} from '@varka/security';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });
    const { prisma } = await import('@varka/database');
    const items = await listCommentsForPost(prisma as never, { postId });
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    try {
      assertSameOrigin(req, allowedOriginsFromEnv());
    } catch (e) {
      if (e instanceof OriginError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const store = await getCache();
    const ip = clientIp(req);
    const rl = await rateLimit({
      key: CacheKeys.rateComment(ip),
      limit: 5,
      windowSec: 600,
      store,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many comments — try later', retryAfterSec: rl.retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const body = await req.json();
    const comment = await submitComment(prisma as never, {
      ...body,
      siteId: site.id,
    });

    void writeAudit(prisma as never, {
      siteId: site.id,
      action: 'comment.submit',
      entityType: 'Comment',
      entityId: (comment as { id?: string }).id,
      ip,
      userAgent: req.headers.get('user-agent'),
      meta: { status: (comment as { status?: string }).status },
    }).catch(() => {});

    return NextResponse.json(
      {
        ok: true,
        status: (comment as { status?: string }).status ?? 'PENDING',
        message: 'Comment submitted for moderation',
      },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
