import { NextResponse } from 'next/server';
import { listCommentsForPost, submitComment } from '@varka/content';
import { CacheKeys, clientIp, getCache, rateLimit } from '@varka/cache';
import {
  allowedOriginsFromEnv,
  assertSameOrigin,
  OriginError,
  writeAudit,
} from '@varka/security';

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin');
  const allowed = allowedOriginsFromEnv();
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin && allowed.map((o) => o.replace(/\/$/, '')).includes(origin.replace(/\/$/, ''))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');
    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400, headers: corsHeaders(req) });
    }
    const { prisma } = await import('@varka/database');
    const items = await listCommentsForPost(prisma as never, { postId });
    return NextResponse.json(
      { items },
      {
        headers: {
          ...corsHeaders(req),
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400, headers: corsHeaders(req) });
  }
}

export async function POST(req: Request) {
  try {
    try {
      assertSameOrigin(req, allowedOriginsFromEnv());
    } catch (e) {
      if (e instanceof OriginError) {
        return NextResponse.json({ error: e.message }, { status: 403, headers: corsHeaders(req) });
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
        {
          status: 429,
          headers: { ...corsHeaders(req), 'Retry-After': String(rl.retryAfterSec) },
        },
      );
    }

    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404, headers: corsHeaders(req) });
    }
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
      { status: 201, headers: corsHeaders(req) },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400, headers: corsHeaders(req) });
  }
}
