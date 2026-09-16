'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/content', label: 'Content' },
  { href: '/media', label: 'Media' },
  { href: '/comments', label: 'Comments' },
  { href: '/appearance', label: 'Appearance' },
  { href: '/languages', label: 'Languages' },
  { href: '/seo', label: 'SEO' },
  { href: '/users', label: 'Users' },
  { href: '/settings', label: 'Settings' },
  { href: '/system', label: 'System' },
];

async function signOut() {
  await fetch('/api/auth/sign-out', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
  window.location.href = '/login';
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: 'grid', gap: 4 }}>
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + '/');
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              textDecoration: 'none',
              color: active ? 'var(--accent)' : 'var(--ink)',
              background: active ? 'rgba(0,0,0,0.04)' : 'transparent',
              fontWeight: active ? 600 : 400,
              fontSize: 14,
            }}
          >
            {l.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => void signOut()}
        style={{
          marginTop: 12,
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 13,
          color: 'var(--muted)',
        }}
      >
        Sign out
      </button>
    </nav>
  );
}
