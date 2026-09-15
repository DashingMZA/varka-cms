/**
 * Reject cross-site state-changing requests when Origin/Referer present and mismatch.
 * Allows same-origin and missing Origin (non-browser clients) — tighten in production edge.
 */
export function assertSameOrigin(req: Request, allowedOrigins: string[]): void {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  const allowed = allowedOrigins.map((o) => o.replace(/\/$/, '')).filter(Boolean);
  if (allowed.length === 0) return;

  if (origin) {
    const o = origin.replace(/\/$/, '');
    if (!allowed.includes(o)) {
      throw new OriginError(`Origin not allowed: ${origin}`);
    }
    return;
  }

  if (referer) {
    try {
      const r = new URL(referer).origin;
      if (!allowed.includes(r)) {
        throw new OriginError(`Referer not allowed`);
      }
    } catch (e) {
      if (e instanceof OriginError) throw e;
      throw new OriginError('Invalid referer');
    }
  }
}

export class OriginError extends Error {
  readonly status = 403 as const;
  constructor(message: string) {
    super(message);
    this.name = 'OriginError';
  }
}

export function allowedOriginsFromEnv(): string[] {
  const list = [
    process.env.ADMIN_URL,
    process.env.SITE_URL,
    process.env.PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean) as string[];
  // Local defaults so Astro (:4321) can post comments to admin (:3000)
  if (process.env.NODE_ENV !== 'production') {
    list.push('http://localhost:4321', 'http://127.0.0.1:4321', 'http://localhost:3000');
  }
  return [...new Set(list.map((o) => o.replace(/\/$/, '')))];
}
