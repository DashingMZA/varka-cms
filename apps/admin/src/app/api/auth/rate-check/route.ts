import { NextResponse } from 'next/server';
import { CacheKeys, clientIp, getCache, rateLimit } from '@varka/cache';
import { writeAudit } from '@varka/security';

/**
 * Pre-auth rate limit probe for login form.
 * Client may call before Better Auth sign-in.
 */
export async function POST(req: Request) {
  try {
    const store = await getCache();
    const ip = clientIp(req);
    const rl = await rateLimit({
      key: CacheKeys.rateLogin(ip),
      limit: 10,
      windowSec: 900,
      store,
    });

    if (!rl.allowed) {
      try {
        const { prisma } = await import('@varka/database');
        void writeAudit(prisma as never, {
          action: 'auth.login_rate_limited',
          entityType: 'Auth',
          ip,
          userAgent: req.headers.get('user-agent'),
        }).catch(() => {});
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        { allowed: false, retryAfterSec: rl.retryAfterSec },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSec) },
        },
      );
    }

    return NextResponse.json({
      allowed: true,
      remaining: rl.remaining,
      limit: rl.limit,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
