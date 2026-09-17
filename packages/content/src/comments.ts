import { z } from 'zod';
import type { AuthContext } from '@varka/permissions';
import { requirePermission } from '@varka/permissions';

export type CommentsDb = {
  comment: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    updateMany: (args: unknown) => Promise<{ count: number }>;
    delete: (args: unknown) => Promise<unknown>;
    deleteMany: (args: unknown) => Promise<{ count: number }>;
    count: (args: unknown) => Promise<number>;
  };
  post: {
    findUnique: (args: unknown) => Promise<unknown>;
  };
};

export const submitCommentInput = z.object({
  siteId: z.string().min(1),
  postId: z.string().min(1),
  parentId: z.string().optional(),
  authorName: z.string().min(1).max(120),
  authorEmail: z.string().email().max(200).optional().or(z.literal('')),
  body: z.string().min(1).max(5000),
  /** Honeypot — bots fill this; humans leave empty */
  website: z.string().max(200).optional(),
});

export type SubmitCommentInput = z.infer<typeof submitCommentInput>;

const SPAM_PATTERNS = [
  /\bviagra\b/i,
  /\bcrypto\s*pump\b/i,
  /\[url=/i,
  /<script/i,
  /\bseo\s*service\b/i,
];

/** Exported for unit tests */
export function looksLikeSpam(body: string, name: string): boolean {
  const sample = `${name} ${body}`;
  if ((sample.match(/https?:\/\//gi) ?? []).length >= 3) return true;
  return SPAM_PATTERNS.some((re) => re.test(sample));
}

function sanitizeBody(body: string): string {
  return body
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/** Public submit — no auth; moderation gate + spam heuristics */
export async function submitComment(db: CommentsDb, raw: SubmitCommentInput) {
  const input = submitCommentInput.parse(raw);
  const post = (await db.post.findUnique({
    where: { id: input.postId },
    select: { id: true, siteId: true, commentsEnabled: true, status: true },
  })) as {
    id: string;
    siteId: string;
    commentsEnabled: boolean;
    status: string;
  } | null;

  if (!post || post.siteId !== input.siteId) throw new Error('Post not found');
  if (!post.commentsEnabled) throw new Error('Comments disabled');
  if (post.status !== 'PUBLISHED') throw new Error('Comments only on published posts');

  if (input.parentId) {
    const parent = (await db.comment.findUnique({
      where: { id: input.parentId },
    })) as { id: string; postId: string; parentId: string | null } | null;
    if (!parent || parent.postId !== input.postId) {
      throw new Error('Invalid parent comment');
    }
    if (parent.parentId) {
      throw new Error('Replies to replies are not allowed');
    }
  }

  const body = sanitizeBody(input.body);
  if (!body) throw new Error('Empty comment');

  const honeypot = Boolean(input.website && input.website.trim());
  const spam = honeypot || looksLikeSpam(body, input.authorName);
  const status = spam ? 'SPAM' : 'PENDING';

  const email =
    input.authorEmail && input.authorEmail.length > 0 ? input.authorEmail : undefined;

  return db.comment.create({
    data: {
      siteId: input.siteId,
      postId: input.postId,
      parentId: input.parentId,
      authorName: input.authorName.slice(0, 120),
      authorEmail: email,
      body,
      status,
    },
  });
}

export async function listCommentsForPost(
  db: CommentsDb,
  opts: { postId: string; includePending?: boolean },
) {
  const statuses = opts.includePending ? ['APPROVED', 'PENDING'] : ['APPROVED'];
  return db.comment.findMany({
    where: {
      postId: opts.postId,
      status: { in: statuses },
      parentId: null,
    },
    orderBy: { createdAt: 'asc' },
    include: {
      replies: {
        where: { status: { in: statuses } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function moderateList(
  db: CommentsDb,
  ctx: AuthContext,
  opts: {
    siteId: string;
    status?: string;
    search?: string;
    cursor?: string;
    limit?: number;
  },
) {
  requirePermission(ctx, 'comments.read');
  const limit = Math.min(opts.limit ?? 30, 100);
  const q = opts.search?.trim();
  const items = (await db.comment.findMany({
    where: {
      siteId: opts.siteId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(q
        ? {
            OR: [
              { authorName: { contains: q, mode: 'insensitive' } },
              { authorEmail: { contains: q, mode: 'insensitive' } },
              { body: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        select: {
          id: true,
          translations: { select: { title: true, slug: true }, take: 1 },
        },
      },
    },
  })) as Array<{ id: string }>;

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    hasMore,
  };
}

export async function setCommentStatus(
  db: CommentsDb,
  ctx: AuthContext,
  id: string,
  status: 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH',
) {
  requirePermission(ctx, 'comments.moderate');
  const existing = await db.comment.findUnique({ where: { id } });
  if (!existing) throw new Error('Not found');
  return db.comment.update({
    where: { id },
    data: { status },
  });
}

/** WordPress-style bulk moderate */
export async function bulkSetCommentStatus(
  db: CommentsDb,
  ctx: AuthContext,
  ids: string[],
  status: 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH',
) {
  requirePermission(ctx, 'comments.moderate');
  if (!ids.length) return { count: 0 };
  return db.comment.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
}

export async function bulkDeleteComments(
  db: CommentsDb,
  ctx: AuthContext,
  ids: string[],
) {
  requirePermission(ctx, 'comments.delete');
  if (!ids.length) return { count: 0 };
  return db.comment.deleteMany({ where: { id: { in: ids } } });
}

export async function updateCommentBody(
  db: CommentsDb,
  ctx: AuthContext,
  id: string,
  bodyRaw: string,
) {
  requirePermission(ctx, 'comments.moderate');
  const body = sanitizeBody(bodyRaw);
  if (!body) throw new Error('Empty comment');
  const existing = await db.comment.findUnique({ where: { id } });
  if (!existing) throw new Error('Not found');
  return db.comment.update({
    where: { id },
    data: { body },
  });
}

/** Staff reply under a comment (approved immediately) */
export async function replyAsStaff(
  db: CommentsDb,
  ctx: AuthContext,
  opts: {
    siteId: string;
    postId: string;
    parentId: string;
    body: string;
    authorName?: string;
  },
) {
  requirePermission(ctx, 'comments.moderate');
  const body = sanitizeBody(opts.body);
  if (!body) throw new Error('Empty comment');

  const parent = (await db.comment.findUnique({
    where: { id: opts.parentId },
  })) as { id: string; postId: string; parentId: string | null } | null;
  if (!parent || parent.postId !== opts.postId) throw new Error('Invalid parent');
  if (parent.parentId) throw new Error('Replies to replies are not allowed');

  return db.comment.create({
    data: {
      siteId: opts.siteId,
      postId: opts.postId,
      parentId: opts.parentId,
      authorName: (opts.authorName ?? 'Site Admin').slice(0, 120),
      authorUserId: ctx.userId === 'dev-user' ? undefined : ctx.userId,
      body,
      status: 'APPROVED',
    },
  });
}

export async function deleteComment(db: CommentsDb, ctx: AuthContext, id: string) {
  requirePermission(ctx, 'comments.delete');
  await db.comment.delete({ where: { id } });
  return { ok: true };
}

export async function commentCounts(db: CommentsDb, ctx: AuthContext, siteId: string) {
  requirePermission(ctx, 'comments.read');
  const [all, pending, approved, spam, trash] = await Promise.all([
    db.comment.count({ where: { siteId } }),
    db.comment.count({ where: { siteId, status: 'PENDING' } }),
    db.comment.count({ where: { siteId, status: 'APPROVED' } }),
    db.comment.count({ where: { siteId, status: 'SPAM' } }),
    db.comment.count({ where: { siteId, status: 'TRASH' } }),
  ]);
  return { all, pending, approved, spam, trash };
}
