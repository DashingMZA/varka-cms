import { PostEditor } from '@/components/post-editor';
import { getPost, listCategories, listTags } from '@varka/content';
import { getSiteId, prisma } from '@/lib/db-site';
import { getAuthContext } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let initialPost: unknown = null;
  let initialCategories: unknown[] = [];
  let initialTags: unknown[] = [];
  let initialMedia: unknown[] = [];

  try {
    const ctx = await getAuthContext();
    const siteId = await getSiteId();
    const [post, cats, tags, media] = await Promise.all([
      getPost(prisma as never, ctx, id).catch(() => null),
      listCategories(prisma as never, ctx, siteId).catch(() => ({ items: [] })),
      listTags(prisma as never, ctx, siteId).catch(() => ({ items: [] })),
      prisma.mediaAsset
        .findMany({
          where: { siteId, mimeType: { startsWith: 'image/' } },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
        .catch(() => []),
    ]);
    initialPost = post;
    initialCategories = (cats as { items: unknown[] }).items ?? [];
    initialTags = (tags as { items: unknown[] }).items ?? [];
    initialMedia = media as unknown[];
  } catch {
    /* empty shell */
  }

  return (
    <main>
      <PostEditor
        postId={id}
        initialPost={initialPost as never}
        initialCategories={initialCategories as never}
        initialTags={initialTags as never}
        initialMedia={initialMedia as never}
      />
    </main>
  );
}
