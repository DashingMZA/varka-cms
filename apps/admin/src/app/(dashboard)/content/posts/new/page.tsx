import { PostEditor } from '@/components/post-editor';

/**
 * WordPress-style Add New: opens a blank editor WITHOUT creating a database
 * record. The draft is only created when the user types a title/content
 * (auto-draft) or clicks Save Draft — like WordPress.
 */
export default function NewPostPage() {
  return (
    <main>
      <PostEditor postId={null} />
    </main>
  );
}
