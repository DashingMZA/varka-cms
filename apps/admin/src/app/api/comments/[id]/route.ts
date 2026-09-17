import { NextResponse } from 'next/server';
import {
  deleteComment,
  replyAsStaff,
  setCommentStatus,
  updateCommentBody,
} from '@varka/content';
import { writeAudit } from '@varka/security';
import { clientIp } from '@varka/cache';
import { getAuthContext } from '@/lib/auth-context';

function errStatus(message: string): number {
  if (message === 'Unauthorized' || message.includes('Unauthorized')) return 401;
  if (message.includes('Forbidden') || message.includes('permission')) return 403;
  if (message.includes('Not found')) return 404;
  return 400;
}

async function getSiteId(db: {
  site: { findFirst: (a: unknown) => Promise<{ id: string } | null> };
}) {
  const site = await db.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found');
  return site.id;
}

export async function PATCH(
  req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctxParams.params;
    const body = (await req.json()) as {
      status?: string;
      body?: string;
      reply?: string;
      postId?: string;
    };
    const { prisma } = await import('@varka/database');
    const ctx = await getAuthContext(req);

    if (typeof body.reply === 'string' && body.postId) {
      const siteId = await getSiteId(prisma as never);
      const created = await replyAsStaff(prisma as never, ctx, {
        siteId,
        postId: body.postId,
        parentId: id,
        body: body.reply,
      });
      return NextResponse.json(created, { status: 201 });
    }

    if (typeof body.body === 'string') {
      const updated = await updateCommentBody(prisma as never, ctx, id, body.body);
      return NextResponse.json(updated);
    }

    const status = body.status as 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH';
    if (!['PENDING', 'APPROVED', 'SPAM', 'TRASH'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const updated = await setCommentStatus(prisma as never, ctx, id, status);
    void writeAudit(prisma as never, {
      actorId: ctx.userId === 'dev-user' ? undefined : ctx.userId,
      action: `comment.${status.toLowerCase()}`,
      entityType: 'Comment',
      entityId: id,
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent'),
    }).catch(() => {});
    return NextResponse.json(updated);
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
    const result = await deleteComment(prisma as never, ctx, id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: errStatus(message) });
  }
}
