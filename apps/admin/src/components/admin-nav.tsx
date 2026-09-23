'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import type { AppLocale } from '@varka/i18n';

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  icon?: string;
  children?: NavChild[];
};

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'nav' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('nav', key);
  if (!v || v === key || v.startsWith('nav.')) return fallback;
  return v;
}

/** Single WP-style menu tree */
function buildNav(t: (ns: 'nav' | 'common', key: string) => string): NavItem[] {
  return [
    { href: '/dashboard', label: L(t, 'dashboard', 'Dashboard'), icon: '⌂' },
    {
      href: '/content',
      label: L(t, 'posts', 'Posts'),
      icon: '✎',
      children: [
        { href: '/content/posts', label: L(t, 'allPosts', 'All Posts') },
        { href: '/content/posts/new', label: L(t, 'addNew', 'Add New') },
        { href: '/content/categories', label: L(t, 'categories', 'Categories') },
        { href: '/content/tags', label: L(t, 'tags', 'Tags') },
      ],
    },
    { href: '/media', label: L(t, 'media', 'Media'), icon: '▣' },
    {
      href: '/content/pages',
      label: L(t, 'pages', 'Pages'),
      icon: '📄',
      children: [
        { href: '/content/pages', label: L(t, 'allPages', 'All Pages') },
        { href: '/content/pages/new', label: L(t, 'addNew', 'Add New') },
      ],
    },
    { href: '/comments', label: L(t, 'comments', 'Comments'), icon: '💬' },
    {
      href: '/appearance',
      label: L(t, 'appearance', 'Appearance'),
      icon: '◐',
      children: [
        { href: '/appearance/themes', label: L(t, 'themes', 'Themes') },
        { href: '/appearance/menus', label: L(t, 'menus', 'Menus') },
        { href: '/appearance/widgets', label: L(t, 'widgets', 'Widgets') },
      ],
    },
    {
      href: '/users',
      label: L(t, 'users', 'Users'),
      icon: '👤',
      children: [
        { href: '/users', label: L(t, 'allUsers', 'All Users') },
        { href: '/users/new', label: L(t, 'addUser', 'Add User') },
        { href: '/users/roles', label: L(t, 'roles', 'Roles') },
        { href: '/users/profile', label: L(t, 'profile', 'Profile') },
      ],
    },
    { href: '/languages', label: L(t, 'languages', 'Languages'), icon: '文' },
    { href: '/seo', label: L(t, 'seo', 'SEO'), icon: '◎' },
    { href: '/system', label: L(t, 'tools', 'Tools'), icon: '⚒' },
    {
      href: '/settings',
      label: L(t, 'settings', 'Settings'),
      icon: '⚙',
      children: [
        { href: '/settings/general', label: L(t, 'settingsGeneral', 'General') },
        { href: '/settings/writing', label: L(t, 'settingsWriting', 'Writing') },
        { href: '/settings/reading', label: L(t, 'settingsReading', 'Reading') },
        { href: '/settings/discussion', label: L(t, 'settingsDiscussion', 'Discussion') },
        { href: '/settings/media', label: L(t, 'settingsMedia', 'Media') },
        { href: '/settings/permalinks', label: L(t, 'settingsPermalinks', 'Permalinks') },
        { href: '/settings/privacy', label: L(t, 'settingsPrivacy', 'Privacy') },
      ],
    },
  ];
}

function pathMatches(pathname: string, href: string): boolean {
  const clean = href.split('?')[0];
  if (pathname === clean) return true;
  if (clean === '/dashboard' || clean === '/users') return false;
  // Posts (/content) must not highlight for Pages (/content/pages)
  if (clean === '/content' && pathname.startsWith('/content/pages')) return false;
  return pathname.startsWith(clean + '/');
}

export function AdminNav(props: { locale?: AppLocale | string } = {}) {
  const { locale } = props;
  const pathname = usePathname() || '';
  const { t, locale: resolvedLocale } = useMessages(locale);
  // Rebuild labels only when locale changes — not every render (t is unstable)
  const NAV = useMemo(
    () => buildNav((ns, key) => t(ns as 'nav', key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedLocale],
  );
  const [folded, setFolded] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Open parent for current path; only setState when a section actually opens
  useEffect(() => {
    const parents = ['/content', '/content/pages', '/appearance', '/users', '/settings'] as const;
    setOpen((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const href of parents) {
        let shouldOpen = pathname === href || pathname.startsWith(`${href}/`);
        // Posts section must not auto-open on Pages routes
        if (href === '/content' && pathname.startsWith('/content/pages')) {
          shouldOpen = false;
        }
        if (shouldOpen && !next[href]) {
          next[href] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname]);

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
    try {
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0]?.trim();
        if (name && /session|token|auth|better-auth|varka/i.test(name)) {
          document.cookie = `${name}=;path=/;max-age=0`;
        }
      });
    } catch {
      /* ignore */
    }
    window.location.href = '/login';
  }

  return (
    <nav className="v-nav" aria-label="Admin">
      <ul className="v-nav__list">
        {NAV.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const childActive =
            hasChildren &&
            item.children!.some((c) => {
              const h = c.href.split('?')[0];
              return pathname === h || (h !== item.href && pathname.startsWith(h + '/'));
            });
          const selfActive = pathMatches(pathname, item.href);
          const active = selfActive || childActive;
          const isOpen = open[item.href] ?? false;

          return (
            <li
              key={item.href}
              className={`v-nav__item${hasChildren ? ' has-submenu' : ''}${
                active ? ' current' : ''
              }${isOpen ? ' opensub' : ''}`}
            >
              {hasChildren ? (
                <>
                  <button
                    type="button"
                    className={`v-nav__link${active || isOpen ? ' is-active' : ''}`}
                    onClick={() =>
                      setOpen((prev) => ({
                        ...prev,
                        [item.href]: !prev[item.href],
                      }))
                    }
                    aria-expanded={isOpen}
                    title={item.label}
                  >
                    {item.icon ? (
                      <span className="v-nav__icon" aria-hidden>
                        {item.icon}
                      </span>
                    ) : null}
                    <span className="v-nav__label">{item.label}</span>
                    <span className="v-nav__chev" aria-hidden>
                      {isOpen ? '▼' : '▶'}
                    </span>
                  </button>
                  {isOpen && !folded ? (
                    <ul className="v-nav__sub">
                      {item.children!.map((child) => {
                        const h = child.href.split('?')[0];
                        const ca =
                          pathname === h ||
                          (h !== item.href && pathname.startsWith(h + '/'));
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`v-nav__link v-nav__link--sub${ca ? ' is-active' : ''}`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`v-nav__link${active ? ' is-active' : ''}`}
                  title={item.label}
                >
                  {item.icon ? (
                    <span className="v-nav__icon" aria-hidden>
                      {item.icon}
                    </span>
                  ) : null}
                  <span className="v-nav__label">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <div className="v-nav__footer">
        <button
          type="button"
          className="v-nav__collapse"
          onClick={toggleFold}
          aria-pressed={folded}
          title={folded ? 'Expand menu' : 'Collapse menu'}
        >
          {folded ? '»' : '«'}{' '}
          <span className="v-nav__label">{folded ? 'Expand' : 'Collapse'}</span>
        </button>
        <button type="button" className="v-nav__signout" onClick={signOut}>
          <span className="v-nav__label">{t('common', 'signOut') || 'Sign out'}</span>
        </button>
      </div>
    </nav>
  );
}
