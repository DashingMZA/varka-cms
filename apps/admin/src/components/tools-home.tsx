'use client';

import Link from 'next/link';
import { useMessages } from '@/lib/i18n';

function L(
  t: (ns: 'tools' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('tools', key);
  if (!v || v === key || v.startsWith('tools.')) return fallback;
  return v;
}

export function ToolsHome() {
  const { t } = useMessages();

  const tools = [
    {
      href: '/tools/import',
      title: L(t, 'import', 'Import'),
      desc: L(t, 'importDesc', 'Import content from a JSON file.'),
    },
    {
      href: '/tools/export',
      title: L(t, 'export', 'Export'),
      desc: L(t, 'exportDesc', 'Download your content as a JSON file.'),
    },
    {
      href: '/system',
      title: L(t, 'siteHealth', 'Site Health'),
      desc: L(t, 'siteHealthDesc', 'Check your site health and system status.'),
    },
  ];

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 className="v-page-title">{L(t, 'tools', 'Tools')}</h1>
      <p className="v-muted">{L(t, 'toolsDesc', 'Import, export, and maintain your site.')}</p>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="v-panel"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <h3 className="v-panel__h">{tool.title}</h3>
            <div className="v-panel__b">
              <p className="v-muted" style={{ margin: 0 }}>
                {tool.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
