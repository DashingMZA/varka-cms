/**
 * Better Auth server instance for VARKA admin.
 * Wire into Next.js route handler: app/api/auth/[...all]/route.ts
 *
 * Local setup:
 *   pnpm install && pnpm db:generate && pnpm db:migrate && pnpm db:seed
 */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@varka/database';

function oauthEnabled(id?: string, secret?: string): boolean {
  return Boolean(id && secret);
}

export function createAuth() {
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
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
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
    trustedOrigins: [process.env.ADMIN_URL, process.env.SITE_URL].filter(Boolean) as string[],
  });
}

export type Auth = ReturnType<typeof createAuth>;
