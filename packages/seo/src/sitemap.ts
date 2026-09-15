export type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

export function buildSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const last = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '';
      const cf = u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : '';
      const pr = u.priority !== undefined ? `<priority>${u.priority}</priority>` : '';
      return `<url><loc>${escapeXml(u.loc)}</loc>${last}${cf}${pr}</url>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function buildRobotsTxt(opts: { siteUrl: string; disallowAdmin?: boolean }): string {
  const base = opts.siteUrl.replace(/\/$/, '');
  const lines = ['User-agent: *', 'Allow: /'];
  if (opts.disallowAdmin !== false) {
    lines.push('Disallow: /admin');
    lines.push('Disallow: /api');
  }
  lines.push(`Sitemap: ${base}/sitemap.xml`);
  return lines.join('\n') + '\n';
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
