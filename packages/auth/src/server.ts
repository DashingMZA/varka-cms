/**
 * Better Auth server instance for VARKA admin.
 * Wire: apps/admin/src/app/api/auth/[...all]/route.ts
 */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@varka/database';

function oauthEnabled(id?: string, secret?: string): boolean {
  return Boolean(id && secret);
}

export function createAuth() {
  const secret = process.env.AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    console.warn(
      '[varka/auth] AUTH_SECRET missing or < 32 chars — set a strong secret before production',
    );
  }

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

  return betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secret: secret ?? 'dev-only-insecure-secret-change-me-now!!',
    baseURL,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      requireEmailVerification: false,
    },
    socialProviders: Object.keys(socialProviders).length ? socialProviders : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      cookiePrefix: 'varka',
    },
    trustedOrigins: [process.env.ADMIN_URL, process.env.SITE_URL, baseURL].filter(
      Boolean,
    ) as string[],
  });
}

export type Auth = ReturnType<typeof createAuth>;
