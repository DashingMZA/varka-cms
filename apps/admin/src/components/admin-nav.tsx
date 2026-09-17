'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  icon?: string;
  children?: NavChild[];
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  {
    href: '/content',
    label: 'Content',
    icon: '☰',
    children: [
      { href: '/content/posts', label: 'Posts' },
      { href: '/content/pages', label: 'Pages' },
    ],
  },
  { href: '/media', label: 'Media', icon: '▣' },
  { href: '/comments', label: 'Comments', icon: '💬' },
  { href: '/appearance', label: 'Appearance', icon: '◐' },
  { href: '/languages', label: 'Languages', icon: '文' },
  { href: '/seo', label: 'SEO', icon: '◎' },
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
  { href: '/system', label: 'System', icon: '⚙' },
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
  if (pathname === href) return true;
  if (href === '/dashboard') return false;
  return pathname.startsWith(href + '/');
}

export function AdminNav() {
  const pathname = usePathname() || '';
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
          item.children!.some(
            (c) => pathname === c.href || pathname.startsWith(c.href + '/'),
          );
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
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                }}
              >
                {item.icon ? <span className="v-nav__icon">{item.icon}</span> : null}
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>{isOpen ? '▼' : '▶'}</span>
              </button>
              {isOpen ? (
                <div className="v-nav__sub">
                  {item.children!.map((child) => {
                    const ca =
                      pathname === child.href ||
                      (child.href !== item.href &&
                        pathname.startsWith(child.href + '/'));
                    return (
                      <Link
                        key={child.href + child.label}
                        href={child.href}
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
          >
            {item.icon ? <span className="v-nav__icon">{item.icon}</span> : null}
            {item.label}
          </Link>
        );
      })}

      <div className="v-nav__footer">
        <button type="button" className="v-nav__signout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
