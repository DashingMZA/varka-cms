/**
 * Login rate-limit + failed-attempt audit (end-to-end guard).
 * Wire around Better Auth sign-in handlers.
 */
import { getCache, rateLimit, clientIp, CacheKeys } from '@varka/cache';
import { writeAudit, type AuditDb } from '@varka/security';
import {
  checkRateLimit,
  createMemoryStore,
  LOCKOUT_THRESHOLD,
  LOCKOUT_MINUTES,
  type RateLimitStore,
} from './rate-limit';

const memoryFallback = createMemoryStore();

export const LOGIN_PATH_SUFFIXES = [
  '/sign-in/email',
  '/sign-in/social',
  '/sign-up/email',
] as const;

export function isLoginPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '');
  return LOGIN_PATH_SUFFIXES.some((s) => p.endsWith(s) || p.includes(s));
}

export function clientIpFromRequest(req: Request): string {
  return clientIp(req);
}

export async function assertLoginRateLimit(req: Request): Promise<
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number; status: 429 }
> {
  const ip = clientIpFromRequest(req);
  const windowSec = Number(process.env.AUTH_LOGIN_WINDOW_SEC ?? 60);
  const limit = Number(process.env.AUTH_LOGIN_RATE_LIMIT ?? 10);

  try {
    const store = await getCache();
    const result = await rateLimit({
      key: CacheKeys.rateLogin(ip),
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
      windowSec: Number.isFinite(windowSec) && windowSec > 0 ? windowSec : 60,
      store,
    });
    if (!result.allowed) {
      return {
        ok: false,
        retryAfterSec: result.retryAfterSec ?? windowSec,
        status: 429,
      };
    }
    return { ok: true, remaining: result.remaining };
  } catch {
    const mem = checkRateLimit(`login:${ip}`, {
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
      windowSec: Number.isFinite(windowSec) && windowSec > 0 ? windowSec : 60,
      store: memoryFallback as RateLimitStore,
    });
    if (!mem.allowed) {
      return { ok: false, retryAfterSec: mem.retryAfterSec, status: 429 };
    }
    return { ok: true, remaining: mem.remaining };
  }
}

const emailFailStore = createMemoryStore();

export function recordEmailFailure(email: string): {
  locked: boolean;
  failures: number;
  retryAfterSec?: number;
} {
  const key = `login-fail:${email.toLowerCase().trim()}`;
  const windowSec = LOCKOUT_MINUTES * 60;
  const cur = emailFailStore.get(key);
  const now = Date.now();
  if (!cur || cur.resetAt <= now) {
    emailFailStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { locked: false, failures: 1 };
  }
  const failures = cur.count + 1;
  emailFailStore.set(key, { count: failures, resetAt: cur.resetAt });
  if (failures >= LOCKOUT_THRESHOLD) {
    return {
      locked: true,
      failures,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
    };
  }
  return { locked: false, failures };
}

export function clearEmailFailures(email: string): void {
  emailFailStore.delete(`login-fail:${email.toLowerCase().trim()}`);
}

export function isEmailLocked(email: string): { locked: boolean; retryAfterSec?: number } {
  const key = `login-fail:${email.toLowerCase().trim()}`;
  const cur = emailFailStore.get(key);
  if (!cur) return { locked: false };
  const now = Date.now();
  if (cur.resetAt <= now) {
    emailFailStore.delete(key);
    return { locked: false };
  }
  if (cur.count >= LOCKOUT_THRESHOLD) {
    return {
      locked: true,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
    };
  }
  return { locked: false };
}

export async function auditLoginEvent(
  db: AuditDb,
  opts: {
    ok: boolean;
    email?: string | null;
    actorId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    reason?: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await writeAudit(db, {
      actorId: opts.actorId ?? null,
      actorEmail: opts.email ?? null,
      action: opts.ok ? 'auth.login.success' : 'auth.login.failure',
      entityType: 'session',
      ip: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
      meta: {
        reason: opts.reason,
        ...opts.meta,
      },
    });
  } catch {
    // Never block login on audit failure
  }
}

export function rateLimitResponse(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({
      message: 'Too many login attempts. Try again later.',
      code: 'RATE_LIMITED',
      retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
        'Cache-Control': 'no-store',
      },
    },
  );
}

export function lockoutResponse(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({
      message: 'Account temporarily locked due to failed attempts.',
      code: 'ACCOUNT_LOCKED',
      retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
        'Cache-Control': 'no-store',
      },
    },
  );
}
