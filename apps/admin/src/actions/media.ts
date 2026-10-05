'use server';

import {
  listMedia,
  uploadMedia,
  deleteMedia,
  updateMediaMeta,
} from '@varka/media';
import { getStorageAdapter } from '@/lib/media-storage';
import { prisma, requireServerAuth } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

import type { ActionResult } from './posts';

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

export async function listMediaAction(
  opts?: { cursor?: string; limit?: number; mimePrefix?: string; month?: string },
): Promise<ActionResult<{ items: unknown[]; nextCursor: string | null; hasMore: boolean }>> {
  try {
    const { ctx, siteId } = await requireServerAuth('media.read');
    const result = (await listMedia(prisma as never, ctx, {
      siteId,
      cursor: opts?.cursor,
      limit: opts?.limit ?? 40,
      mimePrefix: opts?.mimePrefix,
      month: opts?.month,
    })) as { items?: unknown[]; nextCursor?: string | null; hasMore?: boolean };
    return {
      ok: true,
      data: {
        items: JSON.parse(JSON.stringify(result.items ?? [])),
        nextCursor: result.nextCursor ?? null,
        hasMore: result.hasMore ?? false,
      },
    };
  } catch (e) {
    return fail(e);
  }
}

export async function uploadMediaAction(formData: FormData): Promise<ActionResult<unknown>> {
  try {
    const { ctx, siteId } = await requireServerAuth('media.upload');
    const file = formData.get('file');
    if (!(file instanceof File)) return { ok: false, error: 'file required' };

    const buf = Buffer.from(await file.arrayBuffer());
    const storage = await getStorageAdapter();
    const result = await uploadMedia(
      prisma as never,
      storage,
      ctx,
      {
        siteId,
        filename: file.name || 'upload.bin',
        mimeType: file.type || 'application/octet-stream',
        alt: String(formData.get('alt') ?? '') || undefined,
        title: String(formData.get('title') ?? '') || undefined,
        caption: String(formData.get('caption') ?? '') || undefined,
        keywords: String(formData.get('keywords') ?? '') || undefined,
        folder: String(formData.get('folder') ?? '/') || '/',
      },
      buf,
    );
    revalidatePath('/media');
    return { ok: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (e) {
    return fail(e);
  }
}

export async function updateMediaAction(
  id: string,
  data: {
    alt?: string | null;
    title?: string | null;
    caption?: string | null;
    keywords?: string | null;
    folder?: string | null;
  },
): Promise<ActionResult<unknown>> {
  try {
    const { ctx } = await requireServerAuth('media.update');
    const asset = await updateMediaMeta(prisma as never, ctx, id, data as never);
    revalidatePath('/media');
    return { ok: true, data: JSON.parse(JSON.stringify(asset)) };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMediaAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { ctx } = await requireServerAuth('media.delete');
    const storage = await getStorageAdapter();
    await deleteMedia(prisma as never, storage, ctx, id);
    revalidatePath('/media');
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkDeleteMediaAction(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
  try {
    const { ctx } = await requireServerAuth('media.delete');
    if (!Array.isArray(ids) || ids.length === 0) return { ok: true, data: { deleted: 0 } };
    const storage = await getStorageAdapter();
    let deleted = 0;
    for (const id of ids.slice(0, 100)) {
      try {
        await deleteMedia(prisma as never, storage, ctx, id);
        deleted++;
      } catch {
        /* skip failures, continue with the rest */
      }
    }
    revalidatePath('/media');
    return { ok: true, data: { deleted } };
  } catch (e) {
    return fail(e);
  }
}
