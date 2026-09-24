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
    const result = await auth.api.signInEmail({
      body: { email: normalized, password },
      headers: h,
    });

    const r = result as {
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
    const args = { body, headers: h };
    if (typeof api.verifyTOTP === 'function') {
      await api.verifyTOTP(args);
    } else if (typeof api.verifyTwoFactorTOTP === 'function') {
      await api.verifyTwoFactorTOTP(args);
    } else {
      throw new Error('TOTP verify not available');
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
    await auth.api.verifyTwoFactorOTP({
      body: { code: code.trim() },
      headers: await hdrs(),
    });
    return { ok: true };
  } catch {
    try {
      const auth = getAuth();
      await (auth.api as { verifyOTP?: (a: unknown) => Promise<unknown> }).verifyOTP?.({
        body: { code: code.trim() },
        headers: await hdrs(),
      });
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
      jar.get('varka.session_token')?.value ??
      jar.get('better-auth.session_token')?.value;
    if (raw) {
      const token = raw.includes('.') ? raw.split('.')[0]! : raw;
      await prisma.session
        .deleteMany({ where: { OR: [{ token }, { token: raw }] } })
        .catch(() => {});
    }
    jar.set('varka.session_token', '', { httpOnly: true, path: '/', maxAge: 0 });
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
    await auth.api.forgetPassword({
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
