'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

export async function listMediaAction(limit = 100): Promise<ActionResult<{ items: unknown[] }>> {
  try {
    const { siteId } = await requireServerAuth('media.read');
    const items = await prisma.mediaAsset.findMany({
      where: { siteId },
      take: Math.min(limit, 200),
      orderBy: { createdAt: 'desc' },
    });
    return { ok: true, data: { items: JSON.parse(JSON.stringify(items)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMediaAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireServerAuth('media.delete');
    await prisma.mediaAsset.delete({ where: { id } });
    revalidatePath('/media');
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

export async function updateMediaAction(
  id: string,
  data: { alt?: string | null; title?: string | null },
): Promise<ActionResult<unknown>> {
  try {
    await requireServerAuth('media.update');
    const item = await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(data.alt !== undefined ? { alt: data.alt } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
      },
    });
    revalidatePath('/media');
    return { ok: true, data: JSON.parse(JSON.stringify(item)) };
  } catch (e) {
    return fail(e);
  }
}
