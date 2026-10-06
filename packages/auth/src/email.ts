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
  const subject = SUBJECTS[input.type];
  const text = bodyFor(input);

  // 1. Check database email settings first (dynamic)
  try {
    const dbConfig = await getDbEmailConfig();
    if (dbConfig) {
      if (dbConfig.provider === 'smtp' && dbConfig.smtp?.enabled) {
        await sendViaSmtp(dbConfig.smtp, { to: input.to, subject, text });
        return;
      }
      if (dbConfig.provider === 'resend' && dbConfig.resendApiKey) {
        await sendViaResend(dbConfig.resendApiKey, dbConfig.smtp, {
          to: input.to,
          subject,
          text,
        });
        return;
      }
    }
  } catch (e) {
    console.error('[varka/auth-email] DB email failed, falling back', e);
  }

  // 2. Fall back to .env: Resend → SMTP → Webhook
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      await sendViaResend(resendKey, null, { to: input.to, subject, text });
      return;
    } catch (e) {
      console.error('[varka/auth-email] Resend failed, falling back', e);
    }
  }

  const envSmtp = getEnvSmtpConfig();
  if (envSmtp) {
    try {
      await sendViaSmtp(envSmtp, { to: input.to, subject, text });
      return;
    } catch (e) {
      console.error('[varka/auth-email] Env SMTP failed, falling back', e);
    }
  }

  // 3. Webhook (legacy)
  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    'noreply@varka.local';
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
        throw new Error(`Failed to send email: ${res.status} ${body}`);
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

type DbSmtpConfig = {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  /** true = SSL (port 465), false = STARTTLS (port 587) */
  secure: boolean;
};

type DbEmailConfig = {
  provider: 'smtp' | 'resend';
  smtp: DbSmtpConfig | null;
  resendApiKey: string | null;
};

/**
 * Get email config from database (users.email* settings).
 * Returns null if not configured.
 */
async function getDbEmailConfig(): Promise<DbEmailConfig | null> {
  try {
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!site) return null;

    const keys = [
      'users.emailProvider',
      'users.smtpEnabled',
      'users.smtpHost',
      'users.smtpPort',
      'users.smtpUser',
      'users.smtpPass',
      'users.smtpFrom',
      'users.smtpFromName',
      'users.smtpSecure',
      'users.resendApiKey',
    ];
    const settings = await prisma.siteSetting.findMany({
      where: { siteId: site.id, key: { in: keys } },
    });
    const map = Object.fromEntries(
      settings.map((s: { key: string; value: unknown }) => [s.key, s.value]),
    );

    const provider = (map['users.emailProvider'] as string) || 'smtp';

    let smtp: DbSmtpConfig | null = null;
    if (map['users.smtpEnabled'] === true && map['users.smtpHost'] && map['users.smtpUser']) {
      smtp = {
        enabled: true,
        host: String(map['users.smtpHost']),
        port: Number(map['users.smtpPort']) || 587,
        user: String(map['users.smtpUser']),
        pass: String(map['users.smtpPass'] || ''),
        from: String(map['users.smtpFrom'] || map['users.smtpUser']),
        fromName: String(map['users.smtpFromName'] || 'VARKA'),
        // Port 465 = implicit SSL, Port 587 = STARTTLS
        secure: map['users.smtpSecure'] !== false,
      };
    }

    const resendApiKey = map['users.resendApiKey']
      ? String(map['users.resendApiKey'])
      : null;

    // Return config if either provider is usable
    if (provider === 'resend' && resendApiKey) {
      return { provider: 'resend', smtp, resendApiKey };
    }
    if (smtp) {
      return { provider: 'smtp', smtp, resendApiKey };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get SMTP config from .env (fallback when DB not configured).
 */
function getEnvSmtpConfig(): DbSmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  if (!host || !user) return null;
  return {
    enabled: true,
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    user,
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || user,
    fromName: process.env.SMTP_FROM_NAME || 'VARKA',
    secure: process.env.SMTP_SECURE === 'true',
  };
}

/**
 * Send email via Resend API.
 */
async function sendViaResend(
  apiKey: string,
  smtp: DbSmtpConfig | null,
  mail: { to: string; subject: string; text: string },
): Promise<void> {
  const from = smtp?.from || process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@varka.local';
  const fromName = smtp?.fromName || process.env.SMTP_FROM_NAME || 'VARKA';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `${fromName} <${from}>`,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend failed: ${res.status} ${body}`);
  }
}

/**
 * Send email via SMTP using nodemailer.
 */
async function sendViaSmtp(
  config: DbSmtpConfig,
  mail: { to: string; subject: string; text: string },
): Promise<void> {
  // Dynamic require to avoid hard dependency at type-check time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let nodemailer: any;
  try {
    nodemailer = require('nodemailer');
  } catch {
    throw new Error('nodemailer not installed. Run: pnpm add nodemailer --filter @varka/auth');
  }
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure && config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.from}>`,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
  });
}
