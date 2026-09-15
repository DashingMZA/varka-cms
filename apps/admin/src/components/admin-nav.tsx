const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/content', label: 'Content' },
  { href: '/media', label: 'Media' },
  { href: '/comments', label: 'Comments' },
  { href: '/appearance', label: 'Appearance' },
  { href: '/languages', label: 'Languages' },
  { href: '/seo', label: 'SEO' },
  { href: '/users', label: 'Users' },
  { href: '/system', label: 'System' },
  { href: '/settings', label: 'Settings' },
] as const;

export function AdminNav() {
  return (
    <nav aria-label="Admin">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
        {NAV.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              style={{
                display: 'block',
                padding: '8px 12px',
                borderRadius: 8,
                color: 'var(--ink)',
                fontSize: 14,
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
