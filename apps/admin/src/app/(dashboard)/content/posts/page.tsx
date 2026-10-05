import { PostsAdmin } from '@/components/posts-admin';
import { listPostsAction } from '@/actions/posts';
import { listCategoriesAction } from '@/actions/taxonomy';

/** Server Component: fetch initial data on the server so the page renders with data immediately (WordPress-style speed). */
export default async function PostsPage() {
  const [postsResult, catsResult] = await Promise.all([
    listPostsAction({ page: 1, perPage: 20 }),
    listCategoriesAction().catch(() => ({ ok: false as const, error: 'failed' })),
  ]);

  const initialPosts = postsResult.ok
    ? {
        items: (postsResult.data.items as Array<Record<string, unknown>>) ?? [],
        counts: (postsResult.data.counts as Record<string, number>) ?? {
          all: 0,
          published: 0,
          draft: 0,
          trashed: 0,
        },
        total: postsResult.data.total ?? 0,
      }
    : null;

  const initialCategories =
    catsResult && 'ok' in catsResult && catsResult.ok
      ? (
          (catsResult.data as { items?: Array<{ id: string; translations?: Array<{ name?: string }> }> })
            .items ?? []
        ).map((c) => ({ id: c.id, name: c.translations?.[0]?.name || c.id }))
      : [];

  return (
    <main>
      <PostsAdmin initialPosts={initialPosts} initialCategories={initialCategories} />
    </main>
  );
}
