import { PostsAdmin } from '@/components/posts-admin';

export default function PostsPage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Posts</h1>
      <p style={{ color: 'var(--muted)' }}>Create, edit, and publish posts.</p>
      <PostsAdmin />
    </main>
  );
}
