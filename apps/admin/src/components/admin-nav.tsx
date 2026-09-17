'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

type NavItem = {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/content', label: 'Content' },
  { href: '/media', label: 'Media' },
  { href: '/comments', label: 'Comments' },
  { href: '/appearance', label: 'Appearance' },
  { href: '/languages', label: 'Languages' },
  { href: '/seo', label: 'SEO' },
  { href: '/users', label: 'Users' },
  { href: '/system', label: 'System' },
  {
    href: '/settings',
    label: 'Settings',
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

export function AdminNav() {
  const pathname = usePathname() || '';
  const settingsOpen =
    pathname === '/settings' || pathname.startsWith('/settings/');
  const [openSettings, setOpenSettings] = useState(settingsOpen);

  return (
    <nav aria-label="Admin">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) ||
            (item.children && settingsOpen && item.href === '/settings');
          const hasChildren = Boolean(item.children?.length);

          return (
            <li key={item.href}>
              {hasChildren ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenSettings((v) => !v)}
                    style={{
                      display: 'block',
                      padding: '8px 12px',
                      borderRadius: 8,
                      color: 'var(--ink)',
                      fontSize: 14,
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none',
                      background:
                        active || openSettings
                          ? 'var(--accent-soft, #eef2ff)'
                          : 'transparent',
                      fontWeight: active || openSettings ? 600 : 400,
                    }}
                    aria-expanded={openSettings}
                  >
                    <span
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      {item.label}
                      <span style={{ fontSize: 10, opacity: 0.7 }}>
                        {openSettings ? '▼' : '▶'}
                      </span>
                    </span>
                  </button>
                  {openSettings ? (
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: '2px 0 6px 0',
                        padding: '0 0 0 10px',
                        display: 'grid',
                        gap: 1,
                        borderLeft: '2px solid var(--border)',
                        marginLeft: 8,
                      }}
                    >
                      {item.children!.map((child) => {
                        const childActive =
                          pathname === child.href ||
                          pathname.startsWith(child.href + '/');
                        return (
                          <li key={child.href}>
                            <a
                              href={child.href}
                              style={{
                                display: 'block',
                                padding: '6px 10px',
                                borderRadius: 8,
                                fontSize: 13,
                                textDecoration: 'none',
                                fontWeight: childActive ? 600 : 400,
                                background: childActive
                                  ? 'var(--accent-soft, #eef2ff)'
                                  : 'transparent',
                                color: childActive
                                  ? 'var(--accent, #1d4ed8)'
                                  : 'var(--ink)',
                              }}
                            >
                              {child.label}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </>
              ) : (
                <a
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '8px 12px',
                    borderRadius: 8,
                    color: 'var(--ink)',
                    fontSize: 14,
                    textDecoration: 'none',
                    fontWeight: active ? 600 : 400,
                    background: active
                      ? 'var(--accent-soft, #eef2ff)'
                      : 'transparent',
                  }}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
