import type { APIRoute } from 'astro';
import { buildSitemapXml } from '@varka/seo';
import { fetchPublishedPosts } from '../lib/content-api';

export const GET: APIRoute = async () => {
  const site = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  const posts = await fetchPublishedPosts(100);
  const urls = [
    { loc: `${site}/`, changefreq: 'daily' as const, priority: 1 },
    ...posts.map((p) => ({
      loc: `${site}${p.path.startsWith('/') ? p.path : `/${p.path}`}`,
      lastmod: p.publishedAt ?? undefined,
      changefreq: 'weekly' as const,
      priority: 0.8,
    })),
  ];
  const xml = buildSitemapXml(urls);
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
