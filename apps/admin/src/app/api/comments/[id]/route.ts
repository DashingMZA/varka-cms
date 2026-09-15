import { NextResponse } from 'next/server';
import { deleteComment, setCommentStatus } from '@varka/content';
import { writeAudit } from '@varka/security';
import { clientIp } from '@varka/cache';

async function getCtx() {
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: ['comments.read', 'comments.moderate', 'comments.delete'],
  };
}

export async function PATCH(
  req: Request,
  ctxParams: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctxParams.params;
    const body = (await req.json()) as { status?: string };
    const status = body.status as 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH';
    if (!['PENDING', 'APPROVED', 'SPAM', 'TRASH'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const { prisma } = await import('@varka/database');
    const ctx = await getCtx();
    const updated = await setCommentStatus(prisma as never, ctx, id, status);
    void writeAudit(prisma as never, {
      actorId: ctx.userId,
      action: `comment.${status.toLowerCase()}`,
      entityType: 'Comment',
      entityId: id,
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent'),
    }).catch(() => {});
    return NextResponse.json(updated);
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
    const result = await deleteComment(prisma as never, ctx, id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
