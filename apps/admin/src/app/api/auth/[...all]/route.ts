import { getAuth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { prisma } from '@varka/database';
import {
  isLoginPath,
  assertLoginRateLimit,
  rateLimitResponse,
  lockoutResponse,
  isEmailLocked,
  recordEmailFailure,
  clearEmailFailures,
  auditLoginEvent,
  clientIpFromRequest,
} from '@varka/auth/login-guard';

const auth = getAuth();
const handler = toNextJsHandler(auth);

async function parseEmail(req: Request): Promise<string | null> {
  try {
    const clone = req.clone();
    const ct = clone.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = (await clone.json()) as { email?: string };
      return typeof body.email === 'string' ? body.email : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function GET(
  req: Request,
  _ctx: { params: Promise<{ all: string[] }> },
) {
  return handler.GET(req);
}

export async function POST(
  req: Request,
  _ctx: { params: Promise<{ all: string[] }> },
) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (isLoginPath(pathname)) {
    const ip = clientIpFromRequest(req);
    const ua = req.headers.get('user-agent');

    const rl = await assertLoginRateLimit(req);
    if (!rl.ok) {
      void auditLoginEvent(prisma, {
        ok: false,
        ip,
        userAgent: ua,
        reason: 'rate_limited',
        meta: { retryAfterSec: rl.retryAfterSec, path: pathname },
      });
      return rateLimitResponse(rl.retryAfterSec);
    }

    const email = await parseEmail(req);
    if (email && pathname.includes('sign-in/email')) {
      const lock = isEmailLocked(email);
      if (lock.locked) {
        void auditLoginEvent(prisma, {
          ok: false,
          email,
          ip,
          userAgent: ua,
          reason: 'email_lockout',
          meta: { retryAfterSec: lock.retryAfterSec },
        });
        return lockoutResponse(lock.retryAfterSec ?? 900);
      }
    }

    const res = await handler.POST(req);

    if (email && pathname.includes('sign-in/email')) {
      if (res.ok) {
        clearEmailFailures(email);
        void auditLoginEvent(prisma, {
          ok: true,
          email,
          ip,
          userAgent: ua,
          reason: 'ok',
        });
      } else if (res.status === 401 || res.status === 403 || res.status === 400) {
        const fail = recordEmailFailure(email);
        void auditLoginEvent(prisma, {
          ok: false,
          email,
          ip,
          userAgent: ua,
          reason: 'invalid_credentials',
          meta: { failures: fail.failures, locked: fail.locked },
        });
        if (fail.locked) {
          return lockoutResponse(fail.retryAfterSec ?? 900);
        }
      }
    } else if (!res.ok && isLoginPath(pathname)) {
      void auditLoginEvent(prisma, {
        ok: false,
        email,
        ip,
        userAgent: ua,
        reason: `http_${res.status}`,
        meta: { path: pathname },
      });
    }

    return res;
  }

  return handler.POST(req);
}
