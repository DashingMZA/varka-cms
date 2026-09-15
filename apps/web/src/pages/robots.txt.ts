import type { APIRoute } from 'astro';
import { buildRobotsTxt } from '@varka/seo';

const SITE_URL = (import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321').replace(/\/$/, '');

export const prerender = false;

export const GET: APIRoute = () => {
  const body = buildRobotsTxt({ siteUrl: SITE_URL, disallowAdmin: true });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
};
