'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  icon?: string;
  children?: NavChild[];
};

/** Single WP-style menu tree — no duplicate top-level items */
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  {
    href: '/content',
    label: 'Posts',
    icon: '✎',
    children: [
      { href: '/content/posts', label: 'All Posts' },
      { href: '/content/posts', label: 'Add New' },
      { href: '/content/pages', label: 'Pages' },
    ],
  },
  { href: '/media', label: 'Media', icon: '▣' },
  { href: '/comments', label: 'Comments', icon: '💬' },
  { href: '/appearance', label: 'Appearance', icon: '◐' },
  {
    href: '/users',
    label: 'Users',
    icon: '👤',
    children: [
      { href: '/users', label: 'All Users' },
      { href: '/users/new', label: 'Add User' },
      { href: '/users/profile', label: 'Profile' },
    ],
  },
  { href: '/languages', label: 'Languages', icon: '文' },
  { href: '/seo', label: 'SEO', icon: '◎' },
  { href: '/system', label: 'Tools', icon: '⚒' },
  {
    href: '/settings',
    label: 'Settings',
    icon: '⚙',
    children: [
      { href: '/settings/general', label: 'General' },
      { href: '/settings/writing', label: 'Writing' },
      { href: '/settings/reading', label: 'Reading' },
      { href: '/settings/discussion', label: 'Discussion' },
      { href: '/settings/media', label: 'Media' },
      { href: '/settings/permalinks', label: 'Permalinks' },
    ],
  },
];

function isActivePath(pathname: string, href: string): boolean {
  const clean = href.split('?')[0];
  if (pathname === clean) return true;
  if (clean === '/dashboard') return false;
  return pathname.startsWith(clean + '/');
}

export function AdminNav() {
  const pathname = usePathname() || '';
  const [folded, setFolded] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of NAV) {
      if (item.children?.length) {
        init[item.href] =
          pathname === item.href || pathname.startsWith(item.href + '/');
      }
    }
    return init;
  });

  useEffect(() => {
    try {
      const f = localStorage.getItem('varka.admin.folded') === '1';
      setFolded(f);
      document.body.classList.toggle('folded', f);
      document.documentElement.classList.toggle('folded', f);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleFold() {
    setFolded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('varka.admin.folded', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      document.body.classList.toggle('folded', next);
      document.documentElement.classList.toggle('folded', next);
      return next;
    });
  }

  async function signOut() {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
    window.location.href = '/login';
  }

  return (
    <nav className="v-nav" aria-label="Admin">
      {NAV.map((item) => {
        const hasChildren = Boolean(item.children?.length);
        const childActive =
          hasChildren &&
          item.children!.some((c) => {
            const h = c.href.split('?')[0];
            return pathname === h || pathname.startsWith(h + '/');
          });
        const active = isActivePath(pathname, item.href) || childActive;
        const isOpen = open[item.href] ?? false;

        if (hasChildren) {
          return (
            <div key={item.href} className="v-nav__group">
              <button
                type="button"
                className={`v-nav__link${active || isOpen ? ' is-active' : ''}`}
                onClick={() =>
                  setOpen((prev) => ({ ...prev, [item.href]: !prev[item.href] }))
                }
                aria-expanded={isOpen}
                title={item.label}
              >
                {item.icon ? <span className="v-nav__icon">{item.icon}</span> : null}
                <span className="v-nav__label">{item.label}</span>
                <span className="v-nav__chev" style={{ fontSize: 10, opacity: 0.7 }}>
                  {isOpen ? '▼' : '▶'}
                </span>
              </button>
              {isOpen && !folded ? (
                <div className="v-nav__sub">
                  {item.children!.map((child) => {
                    const h = child.href.split('?')[0];
                    const ca =
                      pathname === h ||
                      (h !== item.href && pathname.startsWith(h + '/'));
                    return (
                      <Link
                        key={child.href + child.label}
                        href={h}
                        className={`v-nav__link v-nav__link--sub${ca ? ' is-active' : ''}`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`v-nav__link${active ? ' is-active' : ''}`}
            title={item.label}
          >
            {item.icon ? <span className="v-nav__icon">{item.icon}</span> : null}
            <span className="v-nav__label">{item.label}</span>
          </Link>
        );
      })}

      <div className="v-nav__footer">
        <button
          type="button"
          className="v-nav__collapse"
          onClick={toggleFold}
          aria-pressed={folded}
          title={folded ? 'Expand menu' : 'Collapse menu'}
        >
          {folded ? '»' : '«'} <span className="v-nav__label">Collapse menu</span>
        </button>
        <button type="button" className="v-nav__signout" onClick={signOut}>
          <span className="v-nav__label">Sign out</span>
        </button>
      </div>
    </nav>
  );
}
