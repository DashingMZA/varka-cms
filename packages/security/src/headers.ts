/** Baseline security headers for admin + public responses */
export function securityHeaders(opts?: { frameAncestors?: string }): Record<string, string> {
  const frame = opts?.frameAncestors ?? "'none'";
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
    'Content-Security-Policy': [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "frame-ancestors " + frame,
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  };
}

export function applySecurityHeaders(res: Response): Response {
  const h = securityHeaders();
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(h)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
