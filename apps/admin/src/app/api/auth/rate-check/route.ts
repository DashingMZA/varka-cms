import { NextResponse } from 'next/server';
import { checkRateLimit, shouldLockout, LOCKOUT_THRESHOLD } from '@varka/auth';

/**
 * Pre-login rate limit / lockout check.
 * Client should call before sign-in; also increments failure bucket on ?failed=1.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      failed?: boolean;
    };
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const email = (body.email ?? '').toLowerCase().trim();
    const key = `login:${ip}:${email || 'anon'}`;

    if (body.failed) {
      const r = checkRateLimit(key, { limit: LOCKOUT_THRESHOLD, windowSec: 15 * 60 });
      if (!r.allowed) {
        return NextResponse.json(
          { allowed: false, retryAfterSec: r.retryAfterSec, locked: true },
          { status: 429 },
        );
      }
      const locked = shouldLockout(LOCKOUT_THRESHOLD - (r.remaining ?? 0));
      return NextResponse.json({
        allowed: !locked,
        remaining: r.remaining,
        locked,
      });
    }

    const r = checkRateLimit(key, { limit: 20, windowSec: 60 });
    if (!r.allowed) {
      return NextResponse.json(
        { allowed: false, retryAfterSec: r.retryAfterSec },
        { status: 429 },
      );
    }
    return NextResponse.json({ allowed: true, remaining: r.remaining });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
