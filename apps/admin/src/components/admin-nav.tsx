'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: string; match?: string };

const primary: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂', match: '/dashboard' },
];

const content: NavItem[] = [
  { href: '/content/posts', label: 'Posts', icon: '¶', match: '/content/posts' },
  { href: '/content/pages', label: 'Pages', icon: '☰', match: '/content/pages' },
  { href: '/media', label: 'Media', icon: '▣', match: '/media' },
  { href: '/comments', label: 'Comments', icon: '💬', match: '/comments' },
];

const appearance: NavItem[] = [
  { href: '/appearance', label: 'Themes', icon: '◐', match: '/appearance' },
  { href: '/languages', label: 'Languages', icon: '文', match: '/languages' },
  { href: '/seo', label: 'SEO', icon: '⌕', match: '/seo' },
];

const system: NavItem[] = [
  { href: '/users', label: 'Users', icon: '☺', match: '/users' },
  { href: '/settings', label: 'Settings', icon: '⚙', match: '/settings' },
  { href: '/system', label: 'System', icon: '⌁', match: '/system' },
];

function isActive(pathname: string, item: NavItem): boolean {
  const m = item.match ?? item.href;
  if (m === '/dashboard') return pathname === '/dashboard' || pathname === '/';
  return pathname === m || pathname.startsWith(m + '/');
}

function NavGroup({ label, items, pathname }: { label?: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="v-nav__group">
      {label ? <div className="v-nav__group-label">{label}</div> : null}
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`v-nav__link${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="v-nav__icon" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

async function signOut() {
  await fetch('/api/auth/sign-out', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
  window.location.href = '/login';
}

export function AdminNav() {
  const pathname = usePathname() || '/';

  return (
    <>
      <nav className="v-nav" aria-label="Admin">
        <NavGroup items={primary} pathname={pathname} />
        <NavGroup label="Content" items={content} pathname={pathname} />
        <NavGroup label="Appearance" items={appearance} pathname={pathname} />
        <NavGroup label="Administration" items={system} pathname={pathname} />
      </nav>
      <div className="v-nav__footer">
        <button type="button" className="v-nav__signout" onClick={() => void signOut()}>
          Log Out
        </button>
      </div>
    </>
  );
}
