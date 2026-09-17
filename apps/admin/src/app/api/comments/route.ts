import { NextResponse } from 'next/server';
import {
  bulkDeleteComments,
  bulkSetCommentStatus,
  commentCounts,
  moderateList,
  submitComment,
} from '@varka/content';
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
    if (url.searchParams.get('counts') === '1') {
      const counts = await commentCounts(prisma as never, ctx, siteId);
      return NextResponse.json(counts);
    }
    const status = url.searchParams.get('status') ?? undefined;
    const search = url.searchParams.get('search') ?? undefined;
    const result = await moderateList(prisma as never, ctx, {
      siteId,
      status: status || undefined,
      search,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx.userId || ctx.disabled) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { prisma } = await import('@varka/database');
    const siteId = await getSiteId(prisma as never);
    const body = await req.json();
    const comment = await submitComment(prisma as never, { ...body, siteId });
    return NextResponse.json(comment, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}

/** Bulk actions: { action, ids } */
export async function PUT(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const { prisma } = await import('@varka/database');
    const body = (await req.json()) as {
      action?: string;
      ids?: string[];
    };
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ error: 'No ids' }, { status: 400 });
    }
    const action = body.action;
    if (action === 'delete') {
      const result = await bulkDeleteComments(prisma as never, ctx, ids);
      return NextResponse.json(result);
    }
    const map: Record<string, 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH'> = {
      approve: 'APPROVED',
      unapprove: 'PENDING',
      spam: 'SPAM',
      trash: 'TRASH',
      pending: 'PENDING',
    };
    const status = action ? map[action] : undefined;
    if (!status) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    const result = await bulkSetCommentStatus(prisma as never, ctx, ids, status);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}
