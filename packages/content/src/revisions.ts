import type { AuthContext } from '@varka/permissions';
import { requirePermission } from '@varka/permissions';

export type RevisionsDb = {
  revision: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
  };
  post: {
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
  postTranslation: {
    findFirst: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
};

export async function listPostRevisions(
  db: RevisionsDb,
  ctx: AuthContext,
  postId: string,
  limit = 30,
) {
  requirePermission(ctx, 'posts.read');
  const items = await db.revision.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 100),
    select: {
      id: true,
      title: true,
      note: true,
      languageId: true,
      createdAt: true,
      authorId: true,
    },
  });
  return { items };
}

export async function getRevision(
  db: RevisionsDb,
  ctx: AuthContext,
  id: string,
) {
  requirePermission(ctx, 'posts.read');
  const rev = await db.revision.findUnique({ where: { id } });
  if (!rev) throw new Error('Revision not found');
  return rev;
}

/** Restore a revision into the current post translation + bump version. */
export async function restorePostRevision(
  db: RevisionsDb,
  ctx: AuthContext,
  postId: string,
  revisionId: string,
) {
  requirePermission(ctx, 'posts.update');
  const rev = (await db.revision.findUnique({ where: { id: revisionId } })) as {
    id: string;
    postId: string | null;
    languageId: string | null;
    title: string | null;
    contentHtml: string;
  } | null;
  if (!rev || rev.postId !== postId) throw new Error('Revision not found for post');

  const post = (await db.post.findUnique({ where: { id: postId } })) as {
    version: number;
  } | null;
  if (!post) throw new Error('Post not found');

  const tr = (await db.postTranslation.findFirst({
    where: {
      postId,
      ...(rev.languageId ? { languageId: rev.languageId } : {}),
    },
  })) as { id: string } | null;
  if (!tr) throw new Error('Translation not found');

  await db.postTranslation.update({
    where: { id: tr.id },
    data: {
      ...(rev.title ? { title: rev.title } : {}),
      contentHtml: rev.contentHtml,
    },
  });

  return db.post.update({
    where: { id: postId },
    data: { version: { increment: 1 } },
    include: {
      translations: true,
      featuredImage: true,
      categories: { include: { category: { include: { translations: true } } } },
      tags: { include: { tag: { include: { translations: true } } } },
    },
  });
}
