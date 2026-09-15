import { PostEditor } from '@/components/post-editor';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Edit post</h1>
      <PostEditor postId={id} />
    </main>
  );
}
