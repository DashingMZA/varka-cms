import type { APIRoute } from 'astro';
import { buildSitemapXml } from '@varka/seo';

const SITE_URL = (import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321').replace(/\/$/, '');
const API = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

export const GET: APIRoute = async () => {
  const urls = [{ loc: `${SITE_URL}/`, changefreq: 'daily' as const, priority: 1 }];
  try {
    const res = await fetch(`${API}/api/public/posts?limit=100`);
    if (res.ok) {
      const data = (await res.json()) as { items: Array<{ path: string; publishedAt: string | null }> };
      for (const p of data.items ?? []) {
        urls.push({
          loc: `${SITE_URL}${p.path}`,
          lastmod: p.publishedAt ?? undefined,
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch {
    /* offline */
  }
  return new Response(buildSitemapXml(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
};
