import type { APIRoute } from 'astro';
import { buildRobotsTxt } from '@varka/seo';

const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export const GET: APIRoute = async () => {
  const txt = buildRobotsTxt({ siteUrl: SITE_URL });
  return new Response(txt, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
