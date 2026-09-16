import Link from 'next/link';
import { redirect } from 'next/navigation';

/** Content hub — mirrors WP Posts/Pages split. */
export default function ContentIndexPage() {
  // Default to posts list (WordPress habit)
  redirect('/content/posts');

  return (
    <main>
      <h1 className="v-page-title">Content</h1>
      <p className="v-page-desc">Choose a content type to manage.</p>
      <div className="v-grid-2">
        <div className="v-panel">
          <h2 className="v-panel__h">Posts</h2>
          <div className="v-panel__b">
            <p className="v-muted">Blog posts, articles, news.</p>
            <Link href="/content/posts" className="v-btn v-btn--primary">
              Manage Posts
            </Link>
          </div>
        </div>
        <div className="v-panel">
          <h2 className="v-panel__h">Pages</h2>
          <div className="v-panel__b">
            <p className="v-muted">Static pages (About, Contact, …).</p>
            <Link href="/content/pages" className="v-btn v-btn--primary">
              Manage Pages
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
