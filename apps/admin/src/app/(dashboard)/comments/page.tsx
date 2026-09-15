import { CommentsModeration } from '@/components/comments-moderation';

export default function CommentsPage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Comments</h1>
      <p style={{ color: 'var(--muted)' }}>
        Native comments V1 — approve, spam, trash. Public submit: POST /api/public/comments
      </p>
      <CommentsModeration />
    </main>
  );
}
