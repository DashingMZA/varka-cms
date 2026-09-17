import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeaders, generateCspNonce } from '@varka/security';

/**
 * Next.js 16+: middleware → proxy.ts
 *
 * CSP nonces (CSP_NONCE_ENABLED !== 'false'):
 * 1. Generate per-request nonce
 * 2. Put CSP on request headers so Next can stamp scripts
 * 3. Put same CSP on response for the browser
 * 4. Strip inbound CSP from clients
 *
 * Prefer Next.js ≥ 16.2.5 (GHSA-ffhc-5mcf-pf4q).
 */
export function proxy(req: NextRequest) {
  const nonceEnabled = process.env.CSP_NONCE_ENABLED !== 'false';
  const nonce = nonceEnabled ? generateCspNonce() : undefined;

  const sec = securityHeaders({
    nonce,
    connectSrc: [],
  });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete('content-security-policy');
  requestHeaders.delete('content-security-policy-report-only');
  if (nonce) {
    requestHeaders.set('x-nonce', nonce);
  }
  const cspValue =
    sec['Content-Security-Policy'] ?? sec['Content-Security-Policy-Report-Only'];
  if (cspValue) {
    requestHeaders.set('content-security-policy', cspValue);
  }

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  for (const [k, v] of Object.entries(sec)) {
    res.headers.set(k, v);
  }
  if (nonce) {
    res.headers.set('x-nonce', nonce);
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
