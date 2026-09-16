'use client';

import Link from 'next/link';

export function AdminTopbar() {
  return (
    <header className="v-topbar">
      <Link href="/dashboard" className="v-topbar__brand">
        VARKA
      </Link>
      <Link href="/content/posts" className="v-topbar__link">
        + New Post
      </Link>
      <Link href="/media" className="v-topbar__link">
        Media
      </Link>
      <span className="v-topbar__spacer" />
      <a
        href={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4321'}
        className="v-topbar__link"
        target="_blank"
        rel="noreferrer"
      >
        View Site ↗
      </a>
    </header>
  );
}
