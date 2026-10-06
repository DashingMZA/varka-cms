/**
 * Better Auth server instance for VARKA admin.
 * Wire: apps/admin/src/app/api/auth/[...all]/route.ts
 *
 * Security baseline:
 * - Argon2id password hashing (OWASP); scrypt fallback if native argon2 missing
 * - AUTH_SECRET required ≥32 chars in production
 * - Secure / HttpOnly / SameSite cookies in production
 * - Trusted origins only
 * - Min password length 12; max 128
 * - Email verification OTP + password reset email
 * - TOTP 2FA (twoFactor plugin) + email OTP for 2FA challenge
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { twoFactor } from 'better-auth/plugins';
import { prisma } from '@varka/database';
import { passwordHasher, assertPasswordPolicy } from './password';
import { sendAuthEmail, generateOtpCode } from './email';

const PLACEHOLDER_SECRET = 'dev-only-insecure-secret-change-me-now!!';

/**
 * Parse KEY=VALUE .env lines into process.env (does not override existing).
 * Handles optional quotes and skips comments / empty lines.
 */
function parseEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  let text: string;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] !== undefined && process.env[key] !== '') continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

/** Load monorepo root / app .env before AUTH_SECRET is read. */
export function ensureEnvLoaded(): void {
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, '.env'),
    path.resolve(cwd, '.env.local'),
    path.resolve(cwd, '../../.env'),
    path.resolve(cwd, '../../.env.local'),
    path.resolve(cwd, '../.env'),
    path.resolve(cwd, '../../../.env'),
  ];
  for (const file of candidates) {
    parseEnvFile(file);
  }
}

ensureEnvLoaded();

function oauthEnabled(id?: string, secret?: string): boolean {
  return Boolean(id && secret);
}

export function resolveAuthSecret(): string {
  ensureEnvLoaded();
  const secret = process.env.AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET ?? '';
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret || secret.length < 32) {
    if (isProd) {
      throw new Error(
        '[varka/auth] AUTH_SECRET must be set to a random string ≥ 32 characters in production',
      );
    }
    console.warn(
      '[varka/auth] AUTH_SECRET missing or < 32 chars — using insecure dev placeholder. Set before production.',
    );
    return PLACEHOLDER_SECRET;
  }

  if (
    isProd &&
    (secret.includes('change-me') ||
      secret.includes('dev-only') ||
      secret === 'secret')
  ) {
    throw new Error(
      '[varka/auth] AUTH_SECRET looks like a placeholder — refuse to start in production',
    );
  }

  return secret;
}

export function createAuth() {
  const secret = resolveAuthSecret();
  const isProd = process.env.NODE_ENV === 'production';

  const baseURL =
    process.env.BETTER_AUTH_URL ??
    process.env.ADMIN_URL ??
    'http://localhost:3000';

  const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

  if (oauthEnabled(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    };
  }
  if (oauthEnabled(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET)) {
    socialProviders.github = {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    };
  }

  const trustedOrigins = Array.from(
    new Set(
      [
        process.env.ADMIN_URL,
        process.env.SITE_URL,
        process.env.BETTER_AUTH_URL,
        baseURL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ].filter(Boolean) as string[],
    ),
  );

  const requireEmailVerification =
    process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'true' || isProd;

  return betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secret,
    baseURL,
    appName: process.env.AUTH_APP_NAME || 'VARKA',
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification,
      sendResetPassword: async ({ user, url }) => {
        await sendAuthEmail({
          to: user.email,
          type: 'password-reset',
          url,
        });
      },
      password: {
        hash: async (password: string) => {
          assertPasswordPolicy(password);
          return passwordHasher.hash(password);
        },
        verify: async (data: { hash: string; password: string }) => {
          return passwordHasher.verify(data);
        },
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const code = generateOtpCode();
        await sendAuthEmail({
          to: user.email,
          type: 'email-verification',
          url,
          code,
        });
      },
    },
    socialProviders: Object.keys(socialProviders).length ? socialProviders : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      useSecureCookies: isProd,
      cookiePrefix: 'varka',
      defaultCookieAttributes: {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
      },
      database: {
        // User.id is String @default(cuid()) — Better Auth native
      },
    },
    trustedOrigins,
    plugins: [
      twoFactor({
        issuer: process.env.AUTH_APP_NAME || 'VARKA',
        otpOptions: {
          async sendOTP({ user, otp }) {
            await sendAuthEmail({
              to: user.email,
              type: 'two-factor-otp',
              code: otp,
            });
          },
          period: 5,
        },
      }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** True when resolved secret is the insecure dev placeholder */
export function isUsingPlaceholderSecret(): boolean {
  return resolveAuthSecret() === PLACEHOLDER_SECRET;
}
