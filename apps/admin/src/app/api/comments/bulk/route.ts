import { NextResponse } from 'next/server';
import { setCommentStatus, deleteComment } from '@varka/content';
import { prisma } from '@varka/database';
import { writeAudit } from '@varka/security';
import { clientIp } from '@varka/cache';
import { guard } from '@/lib/api-guard';

export async function POST(req: Request) {
  const g = await guard(req, 'comments.moderate');
  if (g instanceof NextResponse) return g;
  try {
    const body = (await req.json()) as {
      ids?: string[];
      action?: 'APPROVED' | 'PENDING' | 'SPAM' | 'TRASH' | 'DELETE';
    };
    const ids = body.ids ?? [];
    const action = body.action;
    if (!ids.length || !action) {
      return NextResponse.json({ error: 'ids and action required' }, { status: 400 });
    }
    let done = 0;
    for (const id of ids) {
      if (action === 'DELETE') {
        await deleteComment(prisma as never, g.ctx, id);
      } else {
        await setCommentStatus(prisma as never, g.ctx, id, action);
      }
      done += 1;
    }
    void writeAudit(prisma as never, {
      actorId: g.ctx.userId,
      action: `comment.bulk.${action.toLowerCase()}`,
      entityType: 'Comment',
      entityId: ids.join(','),
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent'),
      meta: { count: done },
    }).catch(() => {});
    return NextResponse.json({ ok: true, count: done });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error' },
      { status: 400 },
    );
  }
}
