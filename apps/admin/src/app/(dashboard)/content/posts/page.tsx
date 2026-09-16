import { PostsAdmin } from '@/components/posts-admin';
import { listPosts } from '@varka/content';
import { getSiteId, prisma } from '@/lib/db-site';
import { getAuthContext } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

/** Posts list — initial rows from DB (server); client still mutates via /api. */
export default async function PostsPage() {
  let initialItems: unknown[] = [];
  try {
    const ctx = await getAuthContext();
    const siteId = await getSiteId();
    const result = await listPosts(prisma as never, ctx, { siteId, limit: 100 });
    initialItems = result.items ?? [];
  } catch {
    initialItems = [];
  }

  return (
    <main>
      <PostsAdmin initialItems={initialItems as never} />
    </main>
  );
}
