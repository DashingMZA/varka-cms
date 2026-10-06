'use server';

import { getServerAuth } from '@/lib/server-db';
import {
  requestSensitiveOtp,
  verifySensitiveOtp,
  type SensitiveAction,
} from '@varka/auth';
import type { ActionResult } from './posts';

function fail(e: unknown): ActionResult<never> {
  const message = e instanceof Error ? e.message : 'Something went wrong';
  return { ok: false, error: message };
}

/**
 * Request OTP for a sensitive action.
 * OTP is sent to the user's verified email (or new email for email-change).
 */
export async function requestOtpAction(
  action: SensitiveAction,
  targetEmail?: string,
): Promise<ActionResult<null>> {
  try {
    const ctx = await getServerAuth();
    if (!ctx.userId) return { ok: false, error: 'Not authenticated' };

    const { prisma } = await import('@/lib/server-db');
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true },
    });
    if (!user) return { ok: false, error: 'User not found' };

    // For email-change, send OTP to the NEW email
    const email = action === 'email-change' && targetEmail ? targetEmail : user.email;

    const result = await requestSensitiveOtp(ctx.userId, action, email);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Verify OTP for a sensitive action.
 */
export async function verifyOtpAction(
  action: SensitiveAction,
  code: string,
): Promise<ActionResult<null>> {
  try {
    const ctx = await getServerAuth();
    if (!ctx.userId) return { ok: false, error: 'Not authenticated' };

    const result = await verifySensitiveOtp(ctx.userId, action, code);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
