'use server';

import { headers, cookies } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { prisma } from '@varka/database';
import {
  assertLoginRateLimit,
  recordEmailFailure,
  clearEmailFailures,
  isEmailLocked,
  clientIpFromRequest,
  auditLoginEvent,
} from '@varka/auth';

export type AuthActionResult<T = unknown> =
  | { ok: true; data?: T; twoFactorRedirect?: boolean }
  | { ok: false; error: string; code?: string };

function fail(error: string, code?: string): AuthActionResult<never> {
  return { ok: false, error, code };
}

async function hdrs(): Promise<Headers> {
  return await headers();
}

function requestFromHeaders(h: Headers): Request {
  return new Request('http://localhost/login', { headers: h });
}

/**
 * Better Auth sets the session via `set-cookie` response headers. When calling
 * `auth.api.*` directly from a Server Action (instead of the HTTP route
 * handler), those headers never reach the browser unless we copy them into
 * the Next.js cookie store. Without this, login "succeeds" but the session is
 * missing and /dashboard bounces straight back to /login.
 */
async function forwardSetCookies(respHeaders: Headers): Promise<void> {
  const raw: string[] =
    typeof (respHeaders as unknown as { getSetCookie?: () => string[] }).getSetCookie ===
    'function'
      ? (respHeaders as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : (() => {
          const v = respHeaders.get('set-cookie');
          return v ? [v] : [];
        })();
  if (raw.length === 0) return;
  const jar = await cookies();
  for (const sc of raw) {
    const [pair, ...attrs] = sc.split(';');
    if (!pair) continue;
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!name) continue;
    const opts: {
      path?: string;
      maxAge?: number;
      expires?: Date;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
    } = { path: '/' };
    for (const a of attrs) {
      const [k, ...rest] = a.trim().split('=');
      if (!k) continue;
      const key = k.trim().toLowerCase();
      const val = rest.join('=').trim();
      if (key === 'path' && val) opts.path = val;
      else if (key === 'max-age') {
        const n = Number(val);
        if (Number.isFinite(n)) opts.maxAge = n;
      } else if (key === 'expires' && val) {
        const d = new Date(val);
        if (!Number.isNaN(d.getTime())) opts.expires = d;
      } else if (key === 'httponly') opts.httpOnly = true;
      else if (key === 'secure') opts.secure = true;
      else if (key === 'samesite') {
        const s = val.toLowerCase();
        if (s === 'lax' || s === 'strict' || s === 'none') opts.sameSite = s;
      }
    }
    jar.set(name, value, opts);
  }
}

export async function signInEmailAction(
  email: string,
  password: string,
): Promise<AuthActionResult<{ userId?: string }>> {
  const normalized = email.trim().toLowerCase();
  const h = await hdrs();
  const req = requestFromHeaders(h);
  const ip = clientIpFromRequest(req);

  try {
    const rl = await assertLoginRateLimit(req);
    if (!rl.ok) {
      return fail(`Too many attempts. Retry in ${rl.retryAfterSec}s.`, 'RATE_LIMIT');
    }
    const lock = isEmailLocked(normalized);
    if (lock.locked) {
      return fail(
        `Account temporarily locked. Retry in ${lock.retryAfterSec ?? 60}s.`,
        'LOCKED',
      );
    }

    const auth = getAuth();
    const { headers: resHeaders, response } = await auth.api.signInEmail({
      body: { email: normalized, password },
      headers: h,
      returnHeaders: true,
    });
    // Propagate the session cookie to the browser (see forwardSetCookies).
    await forwardSetCookies(resHeaders);

    const r = response as {
      twoFactorRedirect?: boolean;
      user?: { id?: string };
    };

    if (r?.twoFactorRedirect) {
      return { ok: true, twoFactorRedirect: true };
    }

    try {
      clearEmailFailures(normalized);
      await auditLoginEvent(prisma as never, {
        ok: true,
        email: normalized,
        actorId: r?.user?.id ?? null,
        ip,
        userAgent: h.get('user-agent'),
      });
    } catch {
      /* non-blocking */
    }

    return { ok: true, data: { userId: r?.user?.id } };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid credentials';
    const lower = message.toLowerCase();

    if (lower.includes('email') && lower.includes('verif')) {
      return fail(message, 'EMAIL_NOT_VERIFIED');
    }
    if (lower.includes('two factor') || lower.includes('2fa')) {
      return { ok: true, twoFactorRedirect: true };
    }

    try {
      recordEmailFailure(normalized);
      await auditLoginEvent(prisma as never, {
        ok: false,
        email: normalized,
        ip,
        userAgent: h.get('user-agent'),
        reason: message,
      });
    } catch {
      /* */
    }

    return fail(
      lower.includes('invalid') || lower.includes('credential')
        ? message
        : 'Invalid email or password',
    );
  }
}

export async function verifyTwoFactorTotpAction(
  code: string,
): Promise<AuthActionResult> {
  try {
    const auth = getAuth();
    const api = auth.api as Record<string, (args: unknown) => Promise<unknown>>;
    const body = { code: code.trim() };
    const h = await hdrs();
    const base = { body, headers: h, returnHeaders: true };
    let res: { headers: Headers } | unknown;
    if (typeof api.verifyTOTP === 'function') {
      res = await api.verifyTOTP(base);
    } else if (typeof api.verifyTwoFactorTOTP === 'function') {
      res = await api.verifyTwoFactorTOTP(base);
    } else {
      throw new Error('TOTP verify not available');
    }
    if (res && typeof res === 'object' && 'headers' in res) {
      await forwardSetCookies((res as { headers: Headers }).headers);
    }
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Invalid code');
  }
}

export async function verifyTwoFactorOtpAction(
  code: string,
): Promise<AuthActionResult> {
  try {
    const auth = getAuth();
    const h = await hdrs();
    const res = (await auth.api.verifyTwoFactorOTP({
      body: { code: code.trim() },
      headers: h,
      returnHeaders: true,
    })) as unknown as { headers: Headers };
    if (res && typeof res === 'object' && 'headers' in res) {
      await forwardSetCookies(res.headers);
    }
    return { ok: true };
  } catch {
    try {
      const auth = getAuth();
      const res = (await (
        auth.api as { verifyOTP?: (a: unknown) => Promise<unknown> }
      ).verifyOTP?.({
        body: { code: code.trim() },
        headers: await hdrs(),
        returnHeaders: true,
      })) as unknown as { headers: Headers } | undefined;
      if (res && typeof res === 'object' && 'headers' in res) {
        await forwardSetCookies(res.headers);
      }
      return { ok: true };
    } catch (e2) {
      return fail(e2 instanceof Error ? e2.message : 'Invalid code');
    }
  }
}

export async function verifyTwoFactorAction(code: string): Promise<AuthActionResult> {
  const totp = await verifyTwoFactorTotpAction(code);
  if (totp.ok) return totp;
  return verifyTwoFactorOtpAction(code);
}

export async function signOutAction(): Promise<AuthActionResult> {
  try {
    const auth = getAuth();
    await auth.api.signOut({ headers: await hdrs() });
  } catch {
    /* still clear cookie / DB */
  }

  try {
    const jar = await cookies();
    const raw =
      jar.get('__Secure-varka.session_token')?.value ??
      jar.get('varka.session_token')?.value ??
      jar.get('better-auth.session_token')?.value;
    if (raw) {
      const token = raw.includes('.') ? raw.split('.')[0]! : raw;
      await prisma.session
        .deleteMany({ where: { OR: [{ token }, { token: raw }] } })
        .catch(() => {});
    }
    jar.set('varka.session_token', '', { httpOnly: true, path: '/', maxAge: 0 });
    jar.set('__Secure-varka.session_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });
    jar.set('better-auth.session_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  } catch {
    /* */
  }

  return { ok: true };
}

export async function forgetPasswordAction(
  email: string,
  redirectTo: string,
): Promise<AuthActionResult> {
  try {
    const auth = getAuth();
    await auth.api.requestPasswordReset({
      body: { email: email.trim().toLowerCase(), redirectTo },
      headers: await hdrs(),
    });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function resetPasswordAction(
  token: string,
  newPassword: string,
): Promise<AuthActionResult> {
  try {
    const auth = getAuth();
    await auth.api.resetPassword({
      body: { token, newPassword },
      headers: await hdrs(),
    });
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Reset failed');
  }
}

export async function enableTwoFactorAction(
  password: string,
): Promise<AuthActionResult<{ totpURI?: string; backupCodes?: string[] }>> {
  try {
    const auth = getAuth();
    const result = await auth.api.enableTwoFactor({
      body: { password },
      headers: await hdrs(),
    });
    return { ok: true, data: result as { totpURI?: string; backupCodes?: string[] } };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Enable 2FA failed');
  }
}

export async function verifyTwoFactorEnableAction(
  code: string,
): Promise<AuthActionResult> {
  try {
    const auth = getAuth();
    await auth.api.verifyTOTP({
      body: { code: code.trim() },
      headers: await hdrs(),
    });
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Invalid code');
  }
}

export async function disableTwoFactorAction(
  password: string,
): Promise<AuthActionResult> {
  try {
    const auth = getAuth();
    await auth.api.disableTwoFactor({
      body: { password },
      headers: await hdrs(),
    });
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Disable 2FA failed');
  }
}
