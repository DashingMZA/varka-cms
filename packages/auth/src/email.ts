/**
 * Transactional email sender for auth flows (OTP, verify, reset, 2FA).
 * Dev: logs to console when SMTP is not configured.
 * Prod: SMTP via env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
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

  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info(
      `[varka/auth-email] DEV (no SMTP_HOST) → to=${input.to} type=${input.type} code=${input.code ?? ''} url=${input.url ?? ''}\n${text}`,
    );
    return;
  }

  try {
    const nodemailer = (await import('nodemailer' as string).catch(() => null)) as {
      createTransport: (opts: unknown) => {
        sendMail: (opts: unknown) => Promise<unknown>;
      };
    } | null;

    if (!nodemailer) {
      console.warn('[varka/auth-email] nodemailer not installed — logging email instead');
      console.info(`[varka/auth-email] to=${input.to} subject=${subject}\n${text}`);
      return;
    }

    const port = Number(process.env.SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });

    await transport.sendMail({
      from,
      to: input.to,
      subject,
      text,
    });
  } catch (err) {
    console.error('[varka/auth-email] send failed', err);
    throw new Error('Failed to send email');
  }
}
