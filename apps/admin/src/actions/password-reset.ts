'use server';

import {
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithToken,
} from '@varka/auth';
import type { ActionResult } from './posts';

function fail(e: unknown): ActionResult<never> {
  const message = e instanceof Error ? e.message : 'Something went wrong';
  return { ok: false, error: message };
}

/**
 * Request password reset OTP. Always returns ok to prevent email enumeration.
 */
export async function requestPasswordResetOtpAction(
  email: string,
): Promise<ActionResult<null>> {
  try {
    const { prisma } = await import('@/lib/server-db');
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true },
    });
    // Don't reveal if user exists
    if (!user) return { ok: true, data: null };

    await sendPasswordResetOtp(user.id, user.email);
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Verify password reset OTP. Returns reset token on success.
 */
export async function verifyPasswordResetOtpAction(
  email: string,
  code: string,
): Promise<ActionResult<{ resetToken: string }>> {
  try {
    const { prisma } = await import('@/lib/server-db');
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });
    if (!user) return { ok: false, error: 'Invalid code' };

    const result = await verifyPasswordResetOtp(user.id, code.trim());
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: { resetToken: result.resetToken } };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Reset password with valid token.
 */
export async function resetPasswordWithTokenAction(
  email: string,
  resetToken: string,
  newPassword: string,
): Promise<ActionResult<null>> {
  try {
    const { prisma } = await import('@/lib/server-db');
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });
    if (!user) return { ok: false, error: 'Invalid request' };

    const result = await resetPasswordWithToken(user.id, resetToken, newPassword);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
