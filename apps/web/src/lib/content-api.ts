/**
 * Fetch published content from admin public API.
 * Set PUBLIC_API_URL=http://localhost:3000 in Astro env.
 */
const API = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

export type PublicPostCard = {
  id: string;
  publishedAt: string | null;
  path: string;
  title: string;
  slug: string;
  excerpt: string | null;
  locale: string;
};

export type PublicPostDetail = PublicPostCard & {
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type PublicComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  replies?: PublicComment[];
};

export async function fetchPublishedPosts(limit = 20): Promise<PublicPostCard[]> {
  try {
    const res = await fetch(`${API}/api/public/posts?limit=${limit}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items: PublicPostCard[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function fetchPostBySlug(slug: string): Promise<PublicPostDetail | null> {
  try {
    const res = await fetch(`${API}/api/public/posts/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicPostDetail;
  } catch {
    return null;
  }
}

export async function fetchComments(postId: string): Promise<PublicComment[]> {
  try {
    const res = await fetch(
      `${API}/api/public/comments?postId=${encodeURIComponent(postId)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { items: PublicComment[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export function publicApiBase(): string {
  return API;
}
