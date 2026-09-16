/**
 * Public content — direct PostgreSQL via Prisma (no HTTP to admin).
 * Requires DATABASE_URL in monorepo root `.env` (same as admin).
 */
import { prisma } from '@varka/database';
import {
  listPublishedPosts,
  getPublishedPostBySlug,
  type PublicPostCard,
  type PublicPostDetail,
} from '@varka/content';
import { listCommentsForPost } from '@varka/content';

export type { PublicPostCard, PublicPostDetail };

export type PublicComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  replies?: PublicComment[];
};

async function siteId(): Promise<string | null> {
  try {
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    return site?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchPublishedPosts(limit = 20): Promise<PublicPostCard[]> {
  try {
    const id = await siteId();
    if (!id) return [];
    return await listPublishedPosts(prisma as never, { siteId: id, limit });
  } catch {
    return [];
  }
}

export async function fetchPostBySlug(slug: string): Promise<PublicPostDetail | null> {
  try {
    const id = await siteId();
    if (!id) return null;
    return await getPublishedPostBySlug(prisma as never, { siteId: id, slug });
  } catch {
    return null;
  }
}

export async function fetchComments(postId: string): Promise<PublicComment[]> {
  try {
    const result = await listCommentsForPost(prisma as never, postId);
    const items = (result as { items?: unknown[] }).items ?? (Array.isArray(result) ? result : []);
    return items as PublicComment[];
  } catch {
    return [];
  }
}
