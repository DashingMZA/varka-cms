import Link from 'next/link';
import { prisma } from '@varka/database';

export const dynamic = 'force-dynamic';

/** WordPress-style At a Glance + Quick Draft shortcuts. */
export default async function DashboardPage() {
  let posts = 0;
  let pages = 0;
  let media = 0;
  let users = 0;
  let comments = 0;
  let pendingComments = 0;

  try {
    const [p, pg, m, u, c, pc] = await Promise.all([
      prisma.post.count({ where: { deletedAt: null } }).catch(() => 0),
      prisma.page.count({ where: { deletedAt: null } }).catch(() => 0),
      prisma.mediaAsset.count().catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.comment.count().catch(() => 0),
      prisma.comment.count({ where: { status: 'PENDING' } }).catch(() => 0),
    ]);
    posts = p;
    pages = pg;
    media = m;
    users = u;
    comments = c;
    pendingComments = pc;
  } catch {
    /* DB unavailable */
  }

  const stats = [
    { label: 'Posts', value: posts, href: '/content/posts' },
    { label: 'Pages', value: pages, href: '/content/pages' },
    { label: 'Media', value: media, href: '/media' },
    { label: 'Comments', value: comments, href: '/comments' },
    { label: 'Pending', value: pendingComments, href: '/comments' },
    { label: 'Users', value: users, href: '/users' },
  ];

  return (
    <main>
      <h1 className="v-page-title">Dashboard</h1>
      <p className="v-page-desc">
        Welcome to VARKA. Counts are live from the database — empty modules show zero, not mock data.
      </p>

      <div className="v-btn-row">
        <Link href="/content/posts" className="v-btn v-btn--primary">
          Add Post
        </Link>
        <Link href="/media" className="v-btn">
          Upload Media
        </Link>
        <Link href="/comments" className="v-btn">
          Moderate Comments
          {pendingComments > 0 ? (
            <span className="v-badge" style={{ marginLeft: 4 }}>
              {pendingComments}
            </span>
          ) : null}
        </Link>
        <Link href="/appearance" className="v-btn">
          Themes
        </Link>
      </div>

      <section className="v-panel" aria-labelledby="at-a-glance">
        <h2 id="at-a-glance" className="v-panel__h">
          At a Glance
        </h2>
        <div className="v-panel__b">
          <div className="v-cards" style={{ margin: 0 }}>
            {stats.map((s) => (
              <div key={s.label} className="v-card">
                <div className="v-card__label">{s.label}</div>
                <Link href={s.href} className="v-card__value">
                  {s.value}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="v-grid-2">
        <section className="v-panel">
          <h2 className="v-panel__h">Quick Links</h2>
          <div className="v-panel__b">
            <ul className="v-list">
              <li>
                <Link href="/content/posts">All Posts</Link>
                <span className="v-muted"> — write &amp; publish</span>
              </li>
              <li>
                <Link href="/content/pages">Pages</Link>
                <span className="v-muted"> — static pages</span>
              </li>
              <li>
                <Link href="/media">Media Library</Link>
                <span className="v-muted"> — images &amp; files</span>
              </li>
              <li>
                <Link href="/seo">SEO settings</Link>
                <span className="v-muted"> — titles, meta, sitemap</span>
              </li>
              <li>
                <Link href="/languages">Languages</Link>
                <span className="v-muted"> — locales &amp; routing</span>
              </li>
              <li>
                <Link href="/system">System health</Link>
                <span className="v-muted"> — DB, cache, version</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="v-panel">
          <h2 className="v-panel__h">Activity</h2>
          <div className="v-panel__b">
            <p className="v-muted" style={{ margin: 0 }}>
              {pendingComments > 0
                ? `${pendingComments} comment${pendingComments === 1 ? '' : 's'} awaiting moderation.`
                : 'No pending comments. Recent publish activity will appear here as the editorial workflow expands.'}
            </p>
            <div className="v-btn-row" style={{ marginBottom: 0 }}>
              <Link href="/comments" className="v-btn">
                Open comments
              </Link>
              <Link href="/system" className="v-btn">
                View system
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
