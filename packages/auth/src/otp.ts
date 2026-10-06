/**
 * OTP verification for sensitive actions.
 *
 * Shared module — used by admin dashboard now, Astro frontend later.
 * Actions: email-change, password-change, 2fa-enable, 2fa-disable, 2fa-setup, 2fa-delete
 *
 * Security:
 * - Only OTP hash stored (SHA-256)
 * - 10 minute expiry
 * - Single use (deleted after successful verification)
 * - Older OTPs invalidated when new one requested
 * - Action-specific identifier prevents cross-action reuse
 */

import { randomInt } from 'node:crypto';
import { prisma } from '@varka/database';
import { generateOtpCode, hashOtp, sendAuthEmail, type AuthEmailType } from './email';

export type SensitiveAction =
  | 'email-change'
  | 'password-change'
  | '2fa-enable'
  | '2fa-disable'
  | '2fa-setup'
  | '2fa-delete';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const ACTION_EMAIL_TYPE: Record<SensitiveAction, AuthEmailType> = {
  'email-change': 'email-verification',
  'password-change': 'password-change',
  '2fa-enable': 'two-factor-enable',
  '2fa-disable': 'two-factor-disable',
  '2fa-setup': 'two-factor-otp',
  '2fa-delete': 'two-factor-otp',
};

function identifierFor(userId: string, action: SensitiveAction): string {
  return `sensitive:${userId}:${action}`;
}

/**
 * Generate OTP for a sensitive action, store hash, send email.
 * Invalidates any previous pending OTP for the same user+action.
 */
export async function requestSensitiveOtp(
  userId: string,
  action: SensitiveAction,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const identifier = identifierFor(userId, action);

  // Invalidate older OTPs for this user+action
  await prisma.verification.deleteMany({ where: { identifier } });

  const code = generateOtpCode();
  const hashed = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verification.create({
    data: {
      identifier,
      value: `${hashed}:0`, // hash:attemptCount
      expiresAt,
    },
  });

  try {
    await sendAuthEmail({
      to: email,
      type: ACTION_EMAIL_TYPE[action],
      code,
    });
  } catch (e) {
    // Clean up on email failure
    await prisma.verification.deleteMany({ where: { identifier } });
    return { ok: false, error: 'Failed to send verification email' };
  }

  return { ok: true };
}

/**
 * Verify OTP for a sensitive action.
 * Single-use: deleted on success. Attempt-limited.
 */
export async function verifySensitiveOtp(
  userId: string,
  action: SensitiveAction,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const identifier = identifierFor(userId, action);
  const record = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { ok: false, error: 'No verification code requested' };
  }

  if (record.expiresAt < new Date()) {
    await prisma.verification.delete({ where: { id: record.id } });
    return { ok: false, error: 'Verification code expired' };
  }

  const [storedHash, attemptStr] = record.value.split(':');
  const attempts = parseInt(attemptStr || '0', 10);

  if (attempts >= MAX_ATTEMPTS) {
    await prisma.verification.delete({ where: { id: record.id } });
    return { ok: false, error: 'Too many attempts. Request a new code.' };
  }

  const inputHash = hashOtp(code.trim());
  if (inputHash !== storedHash) {
    await prisma.verification.update({
      where: { id: record.id },
      data: { value: `${storedHash}:${attempts + 1}` },
    });
    return { ok: false, error: 'Invalid verification code' };
  }

  // Success — single use
  await prisma.verification.delete({ where: { id: record.id } });
  return { ok: true };
}

/**
 * Check if there's a pending (unexpired) OTP for user+action.
 */
export async function hasPendingOtp(
  userId: string,
  action: SensitiveAction,
): Promise<boolean> {
  const identifier = identifierFor(userId, action);
  const record = await prisma.verification.findFirst({
    where: { identifier, expiresAt: { gt: new Date() } },
  });
  return Boolean(record);
}

/**
 * Send email verification OTP to a new user.
 * Used when admin creates a user, or for re-sending verification.
 */
export async function sendEmailVerificationOtp(
  userId: string,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const identifier = `email-verify:${userId}`;

  // Invalidate older OTPs
  await prisma.verification.deleteMany({ where: { identifier } });

  const code = generateOtpCode();
  const hashed = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verification.create({
    data: {
      identifier,
      value: `${hashed}:0`,
      expiresAt,
    },
  });

  try {
    await sendAuthEmail({
      to: email,
      type: 'email-verification',
      code,
    });
  } catch (e) {
    await prisma.verification.deleteMany({ where: { identifier } });
    return { ok: false, error: 'Failed to send verification email' };
  }

  return { ok: true };
}

/**
 * Verify email OTP and mark user as verified.
 */
export async function verifyEmailOtp(
  userId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const identifier = `email-verify:${userId}`;
  const record = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { ok: false, error: 'No verification code requested' };
  }

  if (record.expiresAt < new Date()) {
    await prisma.verification.delete({ where: { id: record.id } });
    return { ok: false, error: 'Verification code expired' };
  }

  const [storedHash, attemptStr] = record.value.split(':');
  const attempts = parseInt(attemptStr || '0', 10);

  if (attempts >= MAX_ATTEMPTS) {
    await prisma.verification.delete({ where: { id: record.id } });
    return { ok: false, error: 'Too many attempts. Request a new code.' };
  }

  const inputHash = hashOtp(code.trim());
  if (inputHash !== storedHash) {
    await prisma.verification.update({
      where: { id: record.id },
      data: { value: `${storedHash}:${attempts + 1}` },
    });
    return { ok: false, error: 'Invalid verification code' };
  }

  // Success — mark email verified and delete OTP
  await prisma.verification.delete({ where: { id: record.id } });
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  return { ok: true };
}

/**
 * Send password reset OTP to user's email.
 */
export async function sendPasswordResetOtp(
  userId: string,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const identifier = `pwd-reset:${userId}`;

  await prisma.verification.deleteMany({ where: { identifier } });

  const code = generateOtpCode();
  const hashed = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verification.create({
    data: {
      identifier,
      value: `${hashed}:0`,
      expiresAt,
    },
  });

  try {
    await sendAuthEmail({
      to: email,
      type: 'password-reset',
      code,
    });
  } catch (e) {
    await prisma.verification.deleteMany({ where: { identifier } });
    return { ok: false, error: 'Failed to send reset code' };
  }

  return { ok: true };
}

/**
 * Verify password reset OTP. Returns a reset token on success.
 * The token is single-use and expires in 10 minutes.
 */
export async function verifyPasswordResetOtp(
  userId: string,
  code: string,
): Promise<{ ok: true; resetToken: string } | { ok: false; error: string }> {
  const identifier = `pwd-reset:${userId}`;
  const record = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { ok: false, error: 'No reset code requested' };
  }

  if (record.expiresAt < new Date()) {
    await prisma.verification.delete({ where: { id: record.id } });
    return { ok: false, error: 'Reset code expired' };
  }

  const [storedHash, attemptStr] = record.value.split(':');
  const attempts = parseInt(attemptStr || '0', 10);

  if (attempts >= MAX_ATTEMPTS) {
    await prisma.verification.delete({ where: { id: record.id } });
    return { ok: false, error: 'Too many attempts. Request a new code.' };
  }

  const inputHash = hashOtp(code.trim());
  if (inputHash !== storedHash) {
    await prisma.verification.update({
      where: { id: record.id },
      data: { value: `${storedHash}:${attempts + 1}` },
    });
    return { ok: false, error: 'Invalid reset code' };
  }

  // Success — generate reset token, delete OTP
  await prisma.verification.delete({ where: { id: record.id } });

  const resetToken = generateOtpCode() + generateOtpCode(); // 12 digits
  const tokenHash = hashOtp(resetToken);
  await prisma.verification.create({
    data: {
      identifier: `pwd-reset-token:${userId}`,
      value: tokenHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  return { ok: true, resetToken };
}

/**
 * Reset password using a valid reset token.
 */
export async function resetPasswordWithToken(
  userId: string,
  resetToken: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const identifier = `pwd-reset-token:${userId}`;
  const record = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });

  if (!record || record.expiresAt < new Date()) {
    if (record) await prisma.verification.delete({ where: { id: record.id } });
    return { ok: false, error: 'Reset session expired. Start over.' };
  }

  const tokenHash = hashOtp(resetToken);
  if (tokenHash !== record.value) {
    return { ok: false, error: 'Invalid reset session' };
  }

  // Delete token (single use) and update password
  await prisma.verification.delete({ where: { id: record.id } });

  const { passwordHasher } = await import('./password');
  const { assertPasswordPolicy } = await import('./password');
  assertPasswordPolicy(newPassword);
  const hashed = await passwordHasher.hash(newPassword);

  await prisma.account.updateMany({
    where: { userId, providerId: 'credential' },
    data: { password: hashed },
  });

  return { ok: true };
}
