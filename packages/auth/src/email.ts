/**
 * Transactional email sender for auth flows (OTP, verify, reset, 2FA).
 *
 * Delivery modes (no nodemailer — avoids Turbopack resolve warnings):
 * 1. EMAIL_WEBHOOK_URL set → POST JSON to webhook (Resend/Postmark/custom)
 * 2. Otherwise → log to console (dev-safe)
 */
import { createHash, randomInt } from 'node:crypto';

export type AuthEmailType =
  | 'email-verification'
  | 'password-reset'
  | 'password-change'
  | 'two-factor-enable'
  | 'two-factor-disable'
  | 'two-factor-otp'
  | 'login-otp';

export type SendAuthEmailInput = {
  to: string;
  type: AuthEmailType;
  code?: string;
  url?: string;
  locale?: string;
};

const SUBJECTS: Record<AuthEmailType, string> = {
  'email-verification': 'Verify your email — VARKA',
  'password-reset': 'Reset your password — VARKA',
  'password-change': 'Confirm password change — VARKA',
  'two-factor-enable': 'Enable two-factor authentication — VARKA',
  'two-factor-disable': 'Disable two-factor authentication — VARKA',
  'two-factor-otp': 'Your VARKA security code',
  'login-otp': 'Your VARKA login code',
};

function bodyFor(input: SendAuthEmailInput): string {
  const codeLine = input.code
    ? `\n\nYour verification code is: ${input.code}\nIt expires in 10 minutes.\n`
    : '';
  const urlLine = input.url ? `\n\nOpen this link:\n${input.url}\n` : '';
  const intro: Record<AuthEmailType, string> = {
    'email-verification': 'Confirm your email address for VARKA admin.',
    'password-reset': 'We received a request to reset your VARKA password.',
    'password-change': 'Confirm that you want to change your VARKA password.',
    'two-factor-enable': 'Confirm enabling two-factor authentication on your account.',
    'two-factor-disable': 'Confirm disabling two-factor authentication on your account.',
    'two-factor-otp': 'Use this code to complete two-factor authentication.',
    'login-otp': 'Use this code to sign in to VARKA.',
  };
  return `${intro[input.type]}${codeLine}${urlLine}\nIf you did not request this, ignore this email.\n— VARKA`;
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashOtp(code: string, salt = process.env.AUTH_SECRET ?? 'varka'): string {
  return createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

export async function sendAuthEmail(input: SendAuthEmailInput): Promise<void> {
  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    'noreply@varka.local';
  const subject = SUBJECTS[input.type];
  const text = bodyFor(input);
  const webhook = process.env.EMAIL_WEBHOOK_URL?.trim();

  if (webhook) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const token = process.env.EMAIL_WEBHOOK_TOKEN?.trim();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(webhook, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          from,
          to: input.to,
          subject,
          text,
          type: input.type,
          code: input.code,
          url: input.url,
          locale: input.locale,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[varka/auth-email] webhook failed', res.status, body);
        throw new Error('Failed to send email', { cause: err });
      }
      return;
    } catch (err) {
      console.error('[varka/auth-email] webhook error', err);
      throw new Error('Failed to send email', { cause: err });
    }
  }

  console.info(
    `[varka/auth-email] DEV (no EMAIL_WEBHOOK_URL) → to=${input.to} type=${input.type} code=${input.code ?? ''} url=${input.url ?? ''}\nSubject: ${subject}\n${text}`,
  );
}
