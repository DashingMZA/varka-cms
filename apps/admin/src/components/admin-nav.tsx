'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getStoredLocale, useMessages } from '@/lib/i18n';

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  icon?: string;
  children?: NavChild[];
};

/** Single WP-style menu tree — labels via i18n (no hard-coded strings) */
function buildNav(t: (ns: 'nav', key: string) => string): NavItem[] {
  return [
    { href: '/dashboard', label: t('nav', 'dashboard'), icon: '⌂' },
    {
      href: '/content',
      label: t('nav', 'posts'),
      icon: '✎',
      children: [
        { href: '/content/posts', label: t('nav', 'allPosts') },
        { href: '/content/posts?new=1', label: t('nav', 'addNew') },
        { href: '/content/categories', label: t('nav', 'categories') },
        { href: '/content/tags', label: t('nav', 'tags') },
        { href: '/content/pages', label: t('nav', 'pages') },
      ],
    },
    { href: '/media', label: t('nav', 'media'), icon: '▣' },
    { href: '/comments', label: t('nav', 'comments'), icon: '💬' },
    {
      href: '/appearance',
      label: t('nav', 'appearance'),
      icon: '◐',
      children: [
        { href: '/appearance/themes', label: t('nav', 'themes') },
        { href: '/appearance/menus', label: t('nav', 'menus') },
        { href: '/appearance/widgets', label: t('nav', 'widgets') },
      ],
    },
    {
      href: '/users',
      label: t('nav', 'users'),
      icon: '👤',
      children: [
        { href: '/users', label: t('nav', 'allUsers') },
        { href: '/users/new', label: t('nav', 'addUser') },
        { href: '/users/roles', label: t('nav', 'roles') },
        { href: '/users/profile', label: t('nav', 'profile') },
      ],
    },
    { href: '/languages', label: t('nav', 'languages'), icon: '文' },
    { href: '/seo', label: t('nav', 'seo'), icon: '◎' },
    { href: '/system', label: t('nav', 'tools'), icon: '⚒' },
    {
      href: '/settings',
      label: t('nav', 'settings'),
      icon: '⚙',
      children: [
        { href: '/settings/general', label: t('nav', 'settingsGeneral') },
        { href: '/settings/writing', label: t('nav', 'settingsWriting') },
        { href: '/settings/reading', label: t('nav', 'settingsReading') },
        { href: '/settings/discussion', label: t('nav', 'settingsDiscussion') },
        { href: '/settings/media', label: t('nav', 'settingsMedia') },
        { href: '/settings/permalinks', label: t('nav', 'settingsPermalinks') },
        { href: '/settings/privacy', label: t('nav', 'settingsPrivacy') },
      ],
    },
  ];
}

function isActivePath(pathname: string, href: string): boolean {
  const clean = href.split('?')[0];
  if (pathname === clean) return true;
  if (clean === '/dashboard') return false;
  return pathname.startsWith(clean + '/');
}

export function AdminNav() {
  const pathname = usePathname() || '/dashboard';
  const [locale, setLocale] = useState(getStoredLocale);
  const { t } = useMessages(locale);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setLocale(getStoredLocale());
  }, [pathname]);

  const items = buildNav(t);

  return (
    <nav className="v-nav" aria-label="Admin">
      <ul className="v-nav__list">
        {items.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const childActive = item.children?.some((c) => isActivePath(pathname, c.href));
          const active = isActivePath(pathname, item.href) || childActive;
          const expanded = open === item.href || active;

          return (
            <li key={item.href} className={`v-nav__item${active ? ' is-active' : ''}${expanded && hasChildren ? ' is-open' : ''}`}>
              {hasChildren ? (
                <>
                  <button
                    type="button"
                    className={`v-nav__link${active ? ' is-active' : ''}`}
                    onClick={() => setOpen(expanded ? null : item.href)}
                    aria-expanded={expanded}
                  >
                    <span className="v-nav__icon" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="v-nav__label">{item.label}</span>
                    <span className="v-nav__chev" aria-hidden>
                      {expanded ? '▾' : '▸'}
                    </span>
                  </button>
                  {expanded ? (
                    <ul className="v-nav__sub">
                      {item.children!.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            className={`v-nav__sublink${isActivePath(pathname, c.href) ? ' is-active' : ''}`}
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : (
                <Link href={item.href} className={`v-nav__link${active ? ' is-active' : ''}`}>
                  <span className="v-nav__icon" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="v-nav__label">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
