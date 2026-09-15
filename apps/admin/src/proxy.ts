import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16+: `middleware.ts` is deprecated → use `proxy.ts`.
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 *
 * Proxy is for request shaping (headers, redirects, rewrites).
 * Do NOT use as sole auth gate — authorize in route handlers / layouts.
 * Default runtime: Node.js (not Edge).
 */
const SECURITY: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY)) {
    res.headers.set(k, v);
  }
  if (req.nextUrl.protocol === 'https:') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
