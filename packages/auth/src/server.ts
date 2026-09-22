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
 */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from '@varka/database';
import { passwordHasher, assertPasswordPolicy } from './password';

function oauthEnabled(id?: string, secret?: string): boolean {
  return Boolean(id && secret);
}

function requireAuthSecret(): string {
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
    return 'dev-only-insecure-secret-change-me-now!!';
  }

  if (
    isProd &&
    (secret.includes('change-me') ||
      secret.includes('dev-only') ||
      secret === 'secret')
  ) {
    throw new Error('[varka/auth] AUTH_SECRET looks like a placeholder — refuse to start in production');
  }

  return secret;
}

export function createAuth() {
  const secret = requireAuthSecret();
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

  return betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secret,
    baseURL,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'true',
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
    socialProviders: Object.keys(socialProviders).length ? socialProviders : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      // Disabled: stale session_data signatures make getSession always null
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
    },
    trustedOrigins,
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
