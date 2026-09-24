'use server';

import {
  commentCounts,
  moderateList,
  setCommentStatus,
  deleteComment,
} from '@varka/content';
import { prisma, requireServerAuth } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

export async function listCommentsAction(opts?: {
  status?: string;
}): Promise<ActionResult<unknown>> {
  try {
    const { ctx, siteId } = await requireServerAuth('comments.read');
    const result = await moderateList(prisma as never, ctx, {
      siteId,
      status: opts?.status,
    });
    return { ok: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (e) {
    return fail(e);
  }
}

export async function commentCountsAction(): Promise<ActionResult<unknown>> {
  try {
    const { ctx, siteId } = await requireServerAuth('comments.read');
    const counts = await commentCounts(prisma as never, ctx, siteId);
    return { ok: true, data: JSON.parse(JSON.stringify(counts)) };
  } catch (e) {
    return fail(e);
  }
}

export async function setCommentStatusAction(
  id: string,
  status: 'APPROVED' | 'PENDING' | 'SPAM' | 'TRASH',
): Promise<ActionResult<unknown>> {
  try {
    const { ctx } = await requireServerAuth('comments.moderate');
    const row = await setCommentStatus(prisma as never, ctx, id, status);
    revalidatePath('/comments');
    return { ok: true, data: JSON.parse(JSON.stringify(row)) };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCommentAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { ctx } = await requireServerAuth('comments.delete');
    await deleteComment(prisma as never, ctx, id);
    revalidatePath('/comments');
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkCommentsAction(
  ids: string[],
  action: 'APPROVED' | 'PENDING' | 'SPAM' | 'TRASH' | 'DELETE',
): Promise<ActionResult<{ count: number }>> {
  try {
    const { ctx } = await requireServerAuth(
      action === 'DELETE' ? 'comments.delete' : 'comments.moderate',
    );
    let done = 0;
    for (const id of ids) {
      if (action === 'DELETE') {
        await deleteComment(prisma as never, ctx, id);
      } else {
        await setCommentStatus(prisma as never, ctx, id, action);
      }
      done += 1;
    }
    revalidatePath('/comments');
    return { ok: true, data: { count: done } };
  } catch (e) {
    return fail(e);
  }
}
