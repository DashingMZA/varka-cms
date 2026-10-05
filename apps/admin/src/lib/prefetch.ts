'use client';

/**
 * Prefetch data on nav hover so lists load instantly on click.
 * Warms the server action cache before navigation.
 */

const prefetched = new Set<string>();

export function prefetchRouteData(href: string) {
  if (prefetched.has(href)) return;
  prefetched.add(href);

  // Fire-and-forget: warm up the data for the target page
  void (async () => {
    try {
      if (href.startsWith('/content/posts')) {
        const { listPostsAction } = await import('@/actions/posts');
        await listPostsAction({ page: 1, perPage: 20 });
      } else if (href.startsWith('/content/pages')) {
        const { listPagesAction } = await import('@/actions/pages');
        await listPagesAction({ page: 1, perPage: 20 }).catch(() => {});
      } else if (href.startsWith('/content/categories')) {
        const { listCategoriesAction } = await import('@/actions/taxonomy');
        await listCategoriesAction();
      } else if (href.startsWith('/content/tags')) {
        const { listTagsAction } = await import('@/actions/taxonomy');
        await listTagsAction();
      } else if (href.startsWith('/comments')) {
        const { listCommentsAction } = await import('@/actions/comments');
        await listCommentsAction({});
      } else if (href.startsWith('/media')) {
        const { listMediaAction } = await import('@/actions/media');
        await listMediaAction({ limit: 20 }).catch(() => {});
      } else if (href.startsWith('/users')) {
        const { listUsersAction } = await import('@/actions/users');
        await listUsersAction({ limit: 20 }).catch(() => {});
      }
    } catch {
      /* prefetch is best-effort */
    }
  })();
}
