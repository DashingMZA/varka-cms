import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { AuthContext } from '@varka/permissions';
import { requirePermission } from '@varka/permissions';
import type { StorageAdapter } from './types';

export type MediaDb = {
  mediaAsset: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
};

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'audio/mpeg',
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25MB default

export const uploadMetaSchema = z.object({
  siteId: z.string().min(1),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  alt: z.string().max(500).optional(),
  title: z.string().max(300).optional(),
  folder: z.string().max(200).default('/'),
});

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);
}

function objectKey(filename: string): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const id = randomBytes(6).toString('hex');
  return `${y}/${m}/${id}-${safeFilename(filename)}`;
}

export async function listMedia(
  db: MediaDb,
  ctx: AuthContext,
  opts: { siteId: string; cursor?: string; limit?: number; folder?: string },
) {
  requirePermission(ctx, 'media.read');
  const limit = Math.min(opts.limit ?? 40, 100);
  const items = (await db.mediaAsset.findMany({
    where: {
      siteId: opts.siteId,
      ...(opts.folder ? { folder: opts.folder } : {}),
    },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
  })) as Array<{ id: string }>;
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    hasMore,
  };
}

export async function uploadMedia(
  db: MediaDb,
  storage: StorageAdapter,
  ctx: AuthContext,
  meta: z.infer<typeof uploadMetaSchema>,
  body: Buffer,
) {
  requirePermission(ctx, 'media.upload');
  const input = uploadMetaSchema.parse(meta);

  if (!ALLOWED_MIME.has(input.mimeType)) {
    throw new Error(`MIME not allowed: ${input.mimeType}`);
  }
  if (body.length > MAX_BYTES) {
    throw new Error(`File too large (max ${MAX_BYTES} bytes)`);
  }
  if (body.length === 0) {
    throw new Error('Empty file');
  }

  const key = objectKey(input.filename);
  const checksum = createHash('sha256').update(body).digest('hex');
  const put = await storage.put({ key, body, contentType: input.mimeType });

  const asset = await db.mediaAsset.create({
    data: {
      siteId: input.siteId,
      uploadedById: ctx.userId === 'dev-user' ? null : ctx.userId,
      storage: storage.name,
      key: put.key,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: put.sizeBytes,
      alt: input.alt,
      title: input.title,
      folder: input.folder ?? '/',
      checksum,
    },
  });

  return {
    asset,
    url: storage.getUrl(put.key),
  };
}

export async function deleteMedia(
  db: MediaDb,
  storage: StorageAdapter,
  ctx: AuthContext,
  id: string,
) {
  requirePermission(ctx, 'media.delete');
  const asset = (await db.mediaAsset.findUnique({ where: { id } })) as {
    id: string;
    key: string;
  } | null;
  if (!asset) throw new Error('Not found');
  await storage.delete(asset.key);
  await db.mediaAsset.delete({ where: { id } });
  return { ok: true };
}

export async function updateMediaMeta(
  db: MediaDb,
  ctx: AuthContext,
  id: string,
  data: { alt?: string; title?: string; folder?: string },
) {
  requirePermission(ctx, 'media.update');
  return db.mediaAsset.update({
    where: { id },
    data: {
      ...(data.alt !== undefined ? { alt: data.alt } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.folder !== undefined ? { folder: data.folder } : {}),
    },
  });
}
