'use server';

import { verifyEmailOtp, sendEmailVerificationOtp } from '@varka/auth';
import type { ActionResult } from './posts';

function fail(e: unknown): ActionResult<never> {
  const message = e instanceof Error ? e.message : 'Something went wrong';
  return { ok: false, error: message };
}

/**
 * Verify email OTP for a user (not logged in).
 * Finds user by email, verifies OTP, marks emailVerified=true.
 */
export async function verifyEmailAction(
  email: string,
  code: string,
): Promise<ActionResult<null>> {
  try {
    const { prisma } = await import('@/lib/server-db');
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });
    if (!user) return { ok: false, error: 'User not found' };
    if (user.emailVerified) return { ok: false, error: 'Email already verified' };

    const result = await verifyEmailOtp(user.id, code);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Resend verification OTP to a user (not logged in).
 */
export async function resendVerificationAction(
  email: string,
): Promise<ActionResult<null>> {
  try {
    const { prisma } = await import('@/lib/server-db');
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, emailVerified: true },
    });
    if (!user) return { ok: false, error: 'User not found' };
    if (user.emailVerified) return { ok: false, error: 'Email already verified' };

    const result = await sendEmailVerificationOtp(user.id, user.email);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
