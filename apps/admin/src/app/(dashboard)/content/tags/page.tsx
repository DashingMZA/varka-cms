import { TagsAdmin } from '@/components/tags-admin';
import { listTagsAction } from '@/actions/taxonomy';

/** Server Component: fetch tags on the server for instant render (no /api/ fetch). */
export default async function TagsPage() {
  const result = await listTagsAction().catch(() => ({ ok: false as const, error: 'failed' }));
  const initialItems =
    result && 'ok' in result && result.ok
      ? ((result.data.items as Array<Record<string, unknown>>) ?? [])
      : [];

  return (
    <main>
      <TagsAdmin
        initialItems={
          initialItems as Array<{
            id: string;
            translations: { name: string; slug: string }[];
            _count?: { posts: number };
          }>
        }
      />
    </main>
  );
}
