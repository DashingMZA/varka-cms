import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeaders } from '@varka/security';

/**
 * Next.js 16+: `middleware.ts` is deprecated → use `proxy.ts`.
 * Security headers from `@varka/security` (single source of truth).
 * Do NOT use as sole auth gate — authorize in route handlers / layouts.
 */
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const headers = securityHeaders();
  for (const [k, v] of Object.entries(headers)) {
    res.headers.set(k, v);
  }
  // Allow connect to public site / API during local dual-port dev
  if (process.env.NODE_ENV !== 'production') {
    res.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "img-src 'self' data: blob: https:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "connect-src 'self' http://localhost:* http://127.0.0.1:*",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    );
  }
  if (req.nextUrl.protocol === 'https:') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
