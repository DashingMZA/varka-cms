/** Baseline security headers for admin + public responses */

export type CspOptions = {
  frameAncestors?: string;
  allowUnsafeEval?: boolean;
  connectSrc?: string[];
  imgSrc?: string[];
  reportOnly?: boolean;
  /** Per-request nonce (base64). Enables script-src 'nonce-…' + strict-dynamic */
  nonce?: string;
};

export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  if (typeof btoa === 'function') {
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(bytes).toString('base64url');
}

export function buildCsp(opts?: CspOptions): string {
  const isProd = process.env.NODE_ENV === 'production';
  const allowEval =
    opts?.allowUnsafeEval === true ||
    process.env.CSP_ALLOW_UNSAFE_EVAL === 'true' ||
    (!isProd && opts?.allowUnsafeEval !== false);

  const nonce = opts?.nonce?.replace(/[^A-Za-z0-9+/=_-]/g, '') || '';

  let scriptSrc: string[];
  if (nonce) {
    scriptSrc = [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`];
  } else {
    scriptSrc = [`'self'`, `'unsafe-inline'`];
  }
  if (allowEval) scriptSrc.push(`'unsafe-eval'`);

  const connect = [`'self'`, ...(opts?.connectSrc ?? [])];
  const img = [`'self'`, 'data:', 'blob:', 'https:', ...(opts?.imgSrc ?? [])];
  const frame = opts?.frameAncestors ?? `'none'`;

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${img.join(' ')}`,
    `font-src 'self' data:`,
    `connect-src ${connect.join(' ')}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors ${frame}`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
  ];

  if (isProd) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

export function securityHeaders(opts?: CspOptions): Record<string, string> {
  const csp = buildCsp(opts);
  const reportOnly =
    opts?.reportOnly === true || process.env.CSP_REPORT_ONLY === 'true';
  const cspKey = reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
    'X-DNS-Prefetch-Control': 'off',
    [cspKey]: csp,
  };
}

export function applySecurityHeaders(
  res: Response,
  opts?: CspOptions,
): Response {
  const h = securityHeaders(opts);
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
