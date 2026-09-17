import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeaders } from '@varka/security';

/**
 * Next.js 16+: middleware deprecated → proxy.ts
 * Security headers (CSP, COOP, nosniff) on matched requests.
 */
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const headers = securityHeaders({ connectSrc: [] });
  for (const [k, v] of Object.entries(headers)) {
    res.headers.set(k, v);
  }
  if (req.nextUrl.protocol === 'https:') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
